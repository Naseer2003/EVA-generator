# AWS deployment

`.github/workflows/deploy-aws.yml` builds the three images, pushes them to ECR
and rolls an ECS Fargate service. The infrastructure below has to exist first —
the workflow deploys, it does not provision.

## Shape

One task, three containers:

```
            ALB (443)
          /          \
   /api/*              /*
      |                 |
  backend:3001     frontend:3000
      |
  engine:8000          EFS ──▶ /app/uploads
      |
  RDS / Neon PostgreSQL
```

Containers in a Fargate task share a network namespace, so the backend reaches
the engine on `http://localhost:8000`. That avoids Cloud Map entirely and keeps
the engine unreachable from outside the task — nothing but the backend ever
calls it.

Path-based routing on one ALB means the API is same-origin with the UI, so the
browser never issues a cross-origin request and CORS stops mattering.

## Uploads must be on EFS

This one is not optional. The backend writes uploaded CSVs and their
`-meta.json` sidecars to `./uploads`, and `EvaRun` rows reference those files
**by path** — `getRunById` reads the sidecar, and re-running an analysis
re-parses the CSV. Fargate task storage is ephemeral, so without a persistent
mount every dataset disappears on each deploy and every previously-completed
analysis stops rendering, while its database row survives and points at
nothing.

The task definition mounts an EFS access point at `/app/uploads`. The access
point must map to uid/gid **10001**, which is what the backend image runs as:

```bash
aws efs create-access-point \
  --file-system-id fs-xxxx \
  --posix-user Uid=10001,Gid=10001 \
  --root-directory 'Path=/uploads,CreationInfo={OwnerUid=10001,OwnerGid=10001,Permissions=755}'
```

Moving uploads to S3 would remove this constraint and let the service scale
past one task cleanly. That is a code change, not a deployment one.

## One-time setup

### 1. ECR repositories

```bash
for r in eva-engine eva-backend eva-frontend; do
  aws ecr create-repository --repository-name "$r" \
    --image-scanning-configuration scanOnPush=true
done
```

### 2. OIDC trust

Lets Actions assume a role without storing AWS keys in GitHub.

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

Trust policy on the deploy role — keep the `sub` condition narrow, or any
repository can assume it:

```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
    "StringLike": { "token.actions.githubusercontent.com:sub": "repo:Naseer2003/EVA-generator:ref:refs/heads/main" }
  }
}
```

The role needs: ECR push, `ecs:RegisterTaskDefinition`, `ecs:UpdateService`,
`ecs:DescribeServices`, `ecs:RunTask`, `ecs:DescribeTasks`, and `iam:PassRole`
for the execution and task roles.

### 3. Secrets Manager

Application secrets are read by ECS at task start, so they never reach the CI
logs or the Actions environment.

```bash
aws secretsmanager create-secret --name eva/database-url --secret-string 'postgresql://...'
aws secretsmanager create-secret --name eva/jwt-secret   --secret-string "$(openssl rand -base64 48)"
```

Grant `secretsmanager:GetSecretValue` on both to the **execution** role.

### 4. Service

Enable the deployment circuit breaker, so a bad rollout rolls itself back
instead of leaving the service degraded:

```bash
aws ecs create-service \
  --cluster eva --service-name eva --task-definition eva \
  --desired-count 1 --launch-type FARGATE \
  --deployment-configuration 'deploymentCircuitBreaker={enable=true,rollback=true},minimumHealthyPercent=100,maximumPercent=200' \
  --load-balancers 'targetGroupArn=<frontend-tg>,containerName=frontend,containerPort=3000' \
                   'targetGroupArn=<backend-tg>,containerName=backend,containerPort=3001' \
  --network-configuration 'awsvpcConfiguration={subnets=[...],securityGroups=[...],assignPublicIp=DISABLED}'
```

ALB listener rules: `/api/*` → backend target group, default → frontend.

## Repository configuration

**Secrets** (Settings → Secrets and variables → Actions):

| | |
|---|---|
| `AWS_ROLE_ARN` | the OIDC deploy role |

**Variables:**

| | example |
|---|---|
| `AWS_REGION` | `eu-west-1` |
| `AWS_ACCOUNT_ID` | `123456789012` |
| `ECS_CLUSTER` | `eva` |
| `ECS_SERVICE` | `eva` |
| `PUBLIC_APP_URL` | `https://eva.example.com` — no trailing slash |
| `ECS_EXECUTION_ROLE_ARN` | |
| `ECS_TASK_ROLE_ARN` | |
| `CLOUDWATCH_LOG_GROUP` | `/ecs/eva` |
| `EFS_FILE_SYSTEM_ID` | `fs-0abc…` |
| `EFS_ACCESS_POINT_ID` | `fsap-0abc…` |
| `DATABASE_URL_SECRET_ARN` | |
| `JWT_SECRET_ARN` | |
| `MIGRATION_TASK_DEFINITION` | optional; migrations are skipped if unset |
| `SUBNET_IDS`, `SECURITY_GROUP_ID` | only needed for the migration task |

The workflow fails fast with a named list if any of the required ones are
missing, rather than part-deploying.

## `PUBLIC_APP_URL` is a build input, not a runtime one

`NEXT_PUBLIC_*` values are inlined into the client bundle by `next build`.
Changing `PUBLIC_APP_URL` therefore requires a **rebuild**, not a restart — and
the value must be the origin the *browser* uses. Point it at the ALB or
CloudFront domain, never at an internal address.

## Migrations

If `MIGRATION_TASK_DEFINITION` is set, the workflow runs `prisma migrate
deploy` as a one-off Fargate task **before** the rollout and aborts if it
exits non-zero, leaving the running service untouched. Running it as a task
rather than a workflow step keeps the database reachable only from inside the
VPC.

Register a task definition whose container runs:

```
npx prisma migrate deploy
```

with `DIRECT_URL` from Secrets Manager — the non-pooled endpoint, since
migrations cannot run through a connection pooler.

Leave the variable unset to skip migrations entirely.

## Scaling

The engine is the CPU-bound part: an AD test runs a Monte Carlo whose null
distribution is cached per sample size, so the first analysis at a given *n*
costs a few seconds and subsequent ones are effectively free. That cache is
per-process, so more tasks means more cold starts — raise `UVICORN_WORKERS` or
task CPU before raising task count.

Scaling past one task also needs the uploads problem solved properly (S3),
since EFS write contention and the per-task cache both get worse with replicas.

## What has not been tested

The workflow and task definition are written against the verified image builds
and the application's actual runtime requirements, but **no part of this has
been executed against AWS** — there is no account configured in this
environment. Expect to iterate on IAM permissions and security-group rules on
the first run. Deploy to a non-production cluster first.
