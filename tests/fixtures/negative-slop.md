some notes on our caching rollout for this discussion
setup: we moved the read path from a single shared cache to a per-tenant tiered cache last quarter.

context: the goal was to cut tail latency on the hot endpoints, not to save money on memory. the old design served everyone from one pool, which made the noisy-neighbor problem unavoidable. requests from one big tenant would evict warm entries that smaller tenants depended on, and the whole thing got worse under load.

result: median latency barely moved, but the p99 dropped by a wide margin once each tenant had its own warm set. it's not a throughput win, it's a predictability win, and that distinction is what made the rollout worth defending in review.

there are three things that made it work: strict per-tenant memory budgets, a background warmer that primed the cache before traffic arrived, and a kill switch that let us fall back to the shared pool fast. each of these mattered, and removing any one of them would have sunk the project.

so there are two stories you could tell about this. one says tiered caching is overengineering for a workload this size. the other says it was the only honest fix for a structural problem. both can be true depending on whether you weight operational simplicity or tail behavior more heavily. cache is the lever, not the load.
