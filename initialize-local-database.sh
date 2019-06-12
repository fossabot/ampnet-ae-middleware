#!/bin/bash

source db/init/client-local.sh

psql -f db/init/create-databases.sql