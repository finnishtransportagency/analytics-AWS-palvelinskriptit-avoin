##build executable binary
FROM golang@sha256:1a5f8b6db670a7776ce5beeb69054a7cf7047a5d83176d39b94665a54cfb9756 as builder
ARG branch=master
# Install git + SSL ca certificates.
RUN apk add git
#RUN apk update # && apk add --no-cache git ca-certificates && update-ca-certificates
# Create socketReaderUser
RUN adduser -D -g '' socketReaderUser
#Note we build version from master branch here
RUN git clone  https://github.com/finnishtransportagency/analytics-AWS-palvelinskriptit-avoin.git -b ${branch}
WORKDIR $GOPATH/src/github.com/finnishtransportagency/analytics-AWS-palvelinskriptit-avoin/AIS/WebSocketReader/
COPY . .
# Fetch dependencies.
RUN go get -d -v
# RUN go mod download this might be useful later
# Build the binary
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /go/bin/WebSocketReader
##build a small image
#FROM scratch
# Import from builder.
#COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
#COPY --from=builder /etc/passwd /etc/passwd
# Copy static executable
#COPY --from=builder /go/bin/WebSocketReader /go/bin/WebSocketReader
# Use an unprivileged user.
#USER socketReaderUser
# Run the binary.
ENTRYPOINT ["/go/bin/WebSocketReader"]
