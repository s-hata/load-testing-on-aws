FROM openjdk:8-alpine

LABEL maintainer="Shinichi Hatano <shinichi.hatano@ctc-g.co.jp>"

# constraints
ENV JMETER apache-jmeter-5.0
ENV JMETER_HOME /opt/$JMETER
ENV PATH $PATH:$JMETER_HOME/bin

# variables
ENV RESULTS_LOG results.jtl
ENV JMETER_FLAGS=
ENV JMETER_MEMORY -Xms800m -Xmx800m

# set timezone
RUN apk add --update --no-cache \
    tzdata
RUN export TZ=Asia/Tokyo

# Install the required tools for JMeter
RUN apk add --update --no-cache \
    curl \
    openssh-client

# install JMeter
WORKDIR /opt
RUN curl -O -sS https://archive.apache.org/dist/jmeter/binaries/$JMETER.tgz \
  && tar -xvf $JMETER.tgz \
  && rm $JMETER.tgz \
  && rm -rf $JMETER/docs $JMETER/printable_docs

# copy entrypoint
COPY ./entrypoint.sh /opt/jmeter/
RUN chmod +x /opt/jmeter/entrypoint.sh

WORKDIR /work
RUN mkdir dataset
COPY ./senario.properties .
COPY ./dataset ./dataset

EXPOSE 1099 50000 51000 4445/udp

ENTRYPOINT ["/opt/jmeter/entrypoint.sh"]
