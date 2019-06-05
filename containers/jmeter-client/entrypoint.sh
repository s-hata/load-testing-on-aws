#!/bin/sh
 
HOSTNAME=$(hostname -i)

 SERVER_HOSTS=$(ecs-cli ps --cluster $CLUSTER_NAME | awk '/RUNNING/' | awk '/jmeter-server/' | awk '{print $3}' | sed -e "s/:.*$//" | tr '\r' ',' | tr '\n' ',')
if [ "$SERVER_HOSTS" = '' ]; then
  # echo "SERVER_HOSTS must be specified - a command separated list of hostnames or IP addresses"
  # exit 1
  SERVER_HOSTS="192.168.12.8"
fi
echo "Connecting to $SERVER_HOSTS"
echo "Using Source Code Repository: $SOURCECODE_REPOSITORY_NAME"
echo "Using HOSTNAME $HOSTNAME"

# METADATA=$(curl -s http://169.254.170.2/v2/metadata)
# TASK_ID=$(echo $METADATA | jq -r .TaskARN | sed -e 's/^.*\///')

# set JAVA HEAP
sed -i 's/-Xms1g -Xmx1g -XX:MaxMetaspaceSize=256m/'"$JMETER_MEMORY"'/' $JMETER_HOME/bin/jmeter

# run jmeter in client mode
# use -f option
jmeter -n -X $JMETER_FLAGS \
  -R $SERVER_HOSTS \
  -Dclient.rmi.localport=51000 \
  -Dserver.rmi.ssl.disable=true \
  -Djava.rmi.server.hostname=${HOSTNAME} \
  -l $RESULTS_LOG \
  -t /work/senario.jmx \
  -e -o /work/report

#aws s3 cp $RESULTS_LOG s3://$SOURCECODE_REPOSITORY_NAME/$TASK_ID/
#aws s3 cp ./report s3://$SOURCECODE_REPOSITORY_NAME/$TASK_ID/ --recursive
#aws s3 cp ./*.log s3://$SOURCECODE_REPOSITORY_NAME/$TASK_ID/
