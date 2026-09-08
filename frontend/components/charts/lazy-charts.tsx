'use client';

/**
 * LazyBarChart
 *
 * Recharts is ~500 KB. Importing it statically puts it in the initial JS bundle,
 * blocking first paint on every page — even pages that don't show charts.
 *
 * By using next/dynamic with ssr: false, recharts is:
 *  - Split into its own async chunk
 *  - Only downloaded when this component first mounts
 *  - Never sent to the server (ssr: false)
 *
 * Usage: drop-in replacement for recharts <BarChart> usage sites.
 * All recharts props are forwarded unchanged.
 */

import dynamic from 'next/dynamic';

// Each recharts primitive gets its own lazy import so tree-shaking still works
export const BarChart    = dynamic(() => import('recharts').then(m => ({ default: m.BarChart    })), { ssr: false });
export const Bar         = dynamic(() => import('recharts').then(m => ({ default: m.Bar         })), { ssr: false });
export const XAxis       = dynamic(() => import('recharts').then(m => ({ default: m.XAxis       })), { ssr: false });
export const YAxis       = dynamic(() => import('recharts').then(m => ({ default: m.YAxis       })), { ssr: false });
export const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });
export const Tooltip     = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip     })), { ssr: false });
export const Legend      = dynamic(() => import('recharts').then(m => ({ default: m.Legend      })), { ssr: false });
export const ReferenceLine = dynamic(() => import('recharts').then(m => ({ default: m.ReferenceLine })), { ssr: false });
export const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });
export const LineChart   = dynamic(() => import('recharts').then(m => ({ default: m.LineChart   })), { ssr: false });
export const Line        = dynamic(() => import('recharts').then(m => ({ default: m.Line        })), { ssr: false });
export const AreaChart   = dynamic(() => import('recharts').then(m => ({ default: m.AreaChart   })), { ssr: false });
export const Area        = dynamic(() => import('recharts').then(m => ({ default: m.Area        })), { ssr: false });
export const ScatterChart = dynamic(() => import('recharts').then(m => ({ default: m.ScatterChart })), { ssr: false });
export const Scatter     = dynamic(() => import('recharts').then(m => ({ default: m.Scatter     })), { ssr: false });
export const Cell        = dynamic(() => import('recharts').then(m => ({ default: m.Cell        })), { ssr: false });
export const ZAxis       = dynamic(() => import('recharts').then(m => ({ default: m.ZAxis       })), { ssr: false });
export const ComposedChart = dynamic(() => import('recharts').then(m => ({ default: m.ComposedChart })), { ssr: false });

