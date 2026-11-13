#!/bin/bash
# Double-click to run the v48 prototype locally on http://localhost:5226
cd "$(dirname "$0")"
npm run dev -- --port 5226 --strictPort --open /benable-brand-prototype-v48/nf/brief
