FROM openjdk:8-alpine

LABEL maintainer="Shinichi Hatano <shinichi.hatano@ctc-g.co.jp>"

# Constraints
ENV JMETER_VERSION 5.1.1
ENV CMDRUNNER_VERSION 2.2
ENV PLUGINMGR_VERSION 1.3

# Variables
ENV JMETER apache-jmeter-$JMETER_VERSION
ENV JMETER_HOME /opt/$JMETER
ENV PATH $PATH:$JMETER_HOME/bin
ENV JMETER_MEMORY -Xms800m -Xmx800m
ENV JMETER_FLAGS=

# Set Timezone
RUN apk add --update --no-cache tzdata
RUN export TZ=Asia/Tokyo

# Install packages
RUN apk add --update --no-cache \
    ca-certificates \
    openssh-client \
    openssl \
    python \
    py-pip \
    curl \
    jq

# Install AWS CLI
RUN pip install awscli

WORKDIR /opt

# install JMeter and the JMeter Plugins Manager
RUN curl -O https://archive.apache.org/dist/jmeter/binaries/$JMETER.tgz \
  && tar -xvf apache-jmeter-$JMETER_VERSION.tgz \
  && rm apache-jmeter-$JMETER_VERSION.tgz \
  && rm -rf $JMETER/docs $JMETER/printable_docs \
  && cd $JMETER_HOME/lib \
  && curl -O http://search.maven.org/remotecontent?filepath=kg/apc/cmdrunner/$CMDRUNNER_VERSION/cmdrunner-$CMDRUNNER_VERSION.jar \
  && cd $JMETER_HOME/lib/ext \
  && curl -O http://search.maven.org/remotecontent?filepath=kg/apc/jmeter-plugins-manager/$PLUGINMGR_VERSION/jmeter-plugins-manager-$PLUGINMGR_VERSION.jar \
  && java -cp jmeter-plugins-manager-$PLUGINMGR_VERSION.jar org.jmeterplugins.repository.PluginManagerCMDInstaller

# install all available plugins
RUN PluginsManagerCMD.sh install-all-except jpgc-hadoop,jpgc-oauth \
  && sleep 2 \
  && PluginsManagerCMD.sh status

WORKDIR /loadtesting

# Copy the shell script for entrypoint
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

WORKDIR /work

EXPOSE 1099 50000 51000 4445/udp

ENTRYPOINT ["/loadtesting/entrypoint.sh"]
