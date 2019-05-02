
##build executable binary
FROM golang@sha256:1a5f8b6db670a7776ce5beeb69054a7cf7047a5d83176d39b94665a54cfb9756 as builder
# Install git + SSL ca certificates.
RUN apk update && apk add --no-cache git ca-certificates && update-ca-certificates
# Create socketReaderUser
RUN adduser -D -g '' socketReaderUser

go get github.com/finnishtransportagency/analytics-AWS-palvelinskriptit-avoin/AIS/WebSocketReader/
WORKDIR $GOPATH/src/finnishtransportagency/analytics-AWS-palvelinskriptit-avoin/AIS/WebSocketReader/
COPY . .
# Fetch dependencies.
go get github.com/aws/aws-sdk-go/aws
go get github.com/aws/aws-sdk-go/aws/session
go get github.com/aws/aws-sdk-go/service/s3/s3manager
go get github.com/gorilla/websocket
go get github.com/aws/aws-sdk-go/service/ssm

RUN go mod download
# Build the binary
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /go/bin/AISSocketReader
##build a small image
FROM scratch
# Import from builder.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
# Copy our static executable
COPY --from=builder /go/bin/AISSocketReader /go/bin/AISSocketReader
# Use an unprivileged user.
USER socketReaderUser
# Run the binary.
ENTRYPOINT ["/go/bin/AISSocketReader"]