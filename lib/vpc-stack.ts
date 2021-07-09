import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { FlowLogTrafficType, Vpc } from '@aws-cdk/aws-ec2';

export class VPCStack extends cdk.Stack {
  public readonly sharedvpc: ec2.Vpc;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvetion = appname + "-" + environment

    const vpc = new ec2.Vpc(this, this.node.tryGetContext('vpcname')+ "-"+ namingconvetion, {
      cidr: "10.0.0.0/26",
      maxAzs:2,
      enableDnsHostnames:true,
      enableDnsSupport:true,
      natGateways:2,
      
   })
   vpc.addFlowLog("All flowlogs")
   this.sharedvpc=vpc
   // this tries to find EIP which is suppose to be nat instance IP we need for snowflake
vpc.publicSubnets.forEach((subnet, index) => {
  const EIP = subnet.node.tryFindChild('EIP') as ec2.CfnEIP
  new cdk.CfnOutput(this, `output-eip-${index}`, { value: EIP.ref });
})
  }
}
