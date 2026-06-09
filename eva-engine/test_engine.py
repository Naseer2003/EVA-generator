import sys
sys.path.insert(0, '.')
from app.services.eva_service import run_eva_analysis
from app.models.schemas import EVARequest
import csv

data = []
with open('../test_dataset_wall_loss.csv') as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        if row:
            data.append(float(row[0]))

req = EVARequest(
    data=data,
    method='mle',
    confidence_levels=[0.80, 0.90, 0.95, 0.99],
    return_periods=[100, 500, 1000, 2000]
)
result = run_eva_analysis(req)
print(f'n_observations = {result.n_observations}')
print(f'mu (lambda)    = {result.parameters.mu:.6f}')
print(f'beta (delta)   = {result.parameters.beta:.6f}')
print()
print('Return Levels (LOWER BOUND = conservative for mechanical integrity):')
for rl in result.return_levels:
    print(f'N={rl.period}: best={rl.value:.6f}  SE={rl.se:.6f}')
    for label, cd in sorted(rl.all_confidences.items()):
        lower = cd['lower']
        upper = cd['upper']
        t = cd['t_value']
        print(f'  {label}% lower={lower:.6f}  upper={upper:.6f}  t={t:.4f}')
print()
print('SUCCESS - engine running correctly')
