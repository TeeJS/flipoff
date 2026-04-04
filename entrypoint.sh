#!/bin/sh
chown -R flipoff:flipoff /home/flipoff/.flipoff
exec su-exec flipoff python server.py
