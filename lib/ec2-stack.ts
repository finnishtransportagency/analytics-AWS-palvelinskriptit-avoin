import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { ManagedPolicy } from '@aws-cdk/aws-iam';
import { LookupMachineImage } from '@aws-cdk/aws-ec2';
import { PropagatedTagSource } from '@aws-cdk/aws-ecs';
import { Aws } from '@aws-cdk/core';

interface EC2StackProps extends cdk.StackProps {
  readonly sharedvpc: ec2.Vpc;
  env: {
    region: string,
    account: string
  }
}


export class EC2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EC2StackProps) {
    super(scope, id, props);
   const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvention = appname + "-" + environment
    

    const vpc = props.sharedvpc
    const role = new iam.Role(this, "instanceSSM-Role", 
      { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') }
    )
    role.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this,"ec2SSMRole"+namingconvention,"arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"))
    role.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this,"ec2SSMintanceCore"+namingconvention,"arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"))
    role.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this,"ec2SSMPathAssociation"+namingconvention,"arn:aws:iam::aws:policy/AmazonSSMPatchAssociation"))
    const securityGroup = new ec2.SecurityGroup(this, "analytics-sg-"+namingconvention,{
        vpc: vpc,
        allowAllOutbound: true, // will let your instance send outboud traffic
      }
    )


 
    new ec2.Instance(this, "ec2-instance-"+namingconvention, {
      vpc: vpc,
      role: role,
      securityGroup: securityGroup,
      instanceName: namingconvention,
      instanceType: ec2.InstanceType.of( // t2.micro has free tier usage in aws
        ec2.InstanceClass.T3A,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.GenericLinuxImage({
        "eu-central-1": this.node.tryGetContext('ec2ami') // <- add your ami-region mapping here
       }),
      })
    }
    
  }
  

