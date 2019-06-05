#!/bin/sh

HOSTNAME=$(hostname -i)

# set JAVA HEAP
sed -i 's/-Xms1g -Xmx1g -XX:MaxMetaspaceSize=256m/'"$JMETER_MEMORY"'/' "$JMETER_HOME/bin/jmeter"

# run jmeter in server mode
exec jmeter-server -n \
  -Dserver.rmi.localport=50000 \
  -Dserver.rmi.ssl.disable=true \
  -Djava.rmi.server.hostname="${HOSTNAME}" \
  -Dsun.net.inetaddr.ttl=0 \
  -l "$RESULTS_LOG" \
  -q /work/senario.properties
