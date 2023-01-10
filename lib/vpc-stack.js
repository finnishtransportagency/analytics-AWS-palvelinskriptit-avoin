"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VPCStack = void 0;
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
class VPCStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const environment = id.split("-")[2];
        const appname = id.split("-")[0];
        const namingpath = '/' + appname + '/' + environment;
        const namingconvetion = appname + "-" + environment;
        const vpc = new ec2.Vpc(this, this.node.tryGetContext('vpcname') + "-" + namingconvetion, {
            cidr: "10.0.0.0/26",
            maxAzs: 2,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            natGateways: 2,
        });
        vpc.addFlowLog("All flowlogs");
        this.sharedvpc = vpc;
        // this tries to find EIP which is suppose to be nat instance IP we need for snowflake
        vpc.publicSubnets.forEach((subnet, index) => {
            const EIP = subnet.node.tryFindChild('EIP');
            new cdk.CfnOutput(this, `output-eip-${index}`, { value: EIP.ref });
        });
    }
}
exports.VPCStack = VPCStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyx3Q0FBd0M7QUFHeEMsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFFckMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxHQUFHLE9BQU8sR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFBO1FBQ3BELE1BQU0sZUFBZSxHQUFHLE9BQU8sR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFBO1FBRW5ELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUUsR0FBRyxHQUFFLGVBQWUsRUFBRTtZQUN0RixJQUFJLEVBQUUsYUFBYTtZQUNuQixNQUFNLEVBQUMsQ0FBQztZQUNSLGtCQUFrQixFQUFDLElBQUk7WUFDdkIsZ0JBQWdCLEVBQUMsSUFBSTtZQUNyQixXQUFXLEVBQUMsQ0FBQztTQUVmLENBQUMsQ0FBQTtRQUNGLEdBQUcsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBQyxHQUFHLENBQUE7UUFDbEIsc0ZBQXNGO1FBQ3pGLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzFDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBZSxDQUFBO1lBQ3pELElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUMsQ0FBQTtJQUNBLENBQUM7Q0FDRjtBQTFCRCw0QkEwQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgeyBGbG93TG9nVHJhZmZpY1R5cGUsIFZwYyB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1lYzInO1xuXG5leHBvcnQgY2xhc3MgVlBDU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgc2hhcmVkdnBjOiBlYzIuVnBjO1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIFxuICAgIGNvbnN0IGVudmlyb25tZW50ID0gaWQuc3BsaXQoXCItXCIpWzJdXG4gICAgY29uc3QgYXBwbmFtZSA9IGlkLnNwbGl0KFwiLVwiKVswXVxuICAgIGNvbnN0IG5hbWluZ3BhdGggPSAnLycgKyBhcHBuYW1lICsgJy8nICsgZW52aXJvbm1lbnRcbiAgICBjb25zdCBuYW1pbmdjb252ZXRpb24gPSBhcHBuYW1lICsgXCItXCIgKyBlbnZpcm9ubWVudFxuXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3ZwY25hbWUnKSsgXCItXCIrIG5hbWluZ2NvbnZldGlvbiwge1xuICAgICAgY2lkcjogXCIxMC4wLjAuMC8yNlwiLFxuICAgICAgbWF4QXpzOjIsXG4gICAgICBlbmFibGVEbnNIb3N0bmFtZXM6dHJ1ZSxcbiAgICAgIGVuYWJsZURuc1N1cHBvcnQ6dHJ1ZSxcbiAgICAgIG5hdEdhdGV3YXlzOjIsXG4gICAgICBcbiAgIH0pXG4gICB2cGMuYWRkRmxvd0xvZyhcIkFsbCBmbG93bG9nc1wiKVxuICAgdGhpcy5zaGFyZWR2cGM9dnBjXG4gICAvLyB0aGlzIHRyaWVzIHRvIGZpbmQgRUlQIHdoaWNoIGlzIHN1cHBvc2UgdG8gYmUgbmF0IGluc3RhbmNlIElQIHdlIG5lZWQgZm9yIHNub3dmbGFrZVxudnBjLnB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICBjb25zdCBFSVAgPSBzdWJuZXQubm9kZS50cnlGaW5kQ2hpbGQoJ0VJUCcpIGFzIGVjMi5DZm5FSVBcbiAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYG91dHB1dC1laXAtJHtpbmRleH1gLCB7IHZhbHVlOiBFSVAucmVmIH0pO1xufSlcbiAgfVxufVxuIl19