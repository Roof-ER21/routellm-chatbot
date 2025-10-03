#!/bin/bash
# Use Railway's PORT if set, otherwise 4000
PORT=${PORT:-4000}
next start -p $PORT
