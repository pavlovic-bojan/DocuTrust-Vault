#!/bin/bash

# Example script to run k6 performance tests
# This script demonstrates how to run tests with proper environment variables

# Set your environment
export TEST_ENV=DEMO10
export DEMO_10_URL="https://demo10.gitf.cms.globalitfactory.eu/cms"
export AUTH_TOKEN="your-auth-token-here"

# Run smoke test
echo "Running smoke test..."
k6 run smoke/smoke.js

# Uncomment to run other tests:
# echo "Running baseline test..."
# k6 run baseline/baseline.js

# echo "Running load test..."
# k6 run load/load.js

# echo "Running stress test..."
# k6 run stress/stress.js

# echo "Running spike test..."
# k6 run spike/spike.js

# echo "Running breakpoint test..."
# k6 run breakpoint/breakpoint.js

# echo "Running soak test..."
# k6 run soak/soak.js
