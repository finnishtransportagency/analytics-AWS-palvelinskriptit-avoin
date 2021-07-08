import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ecs from '@aws-cdk/aws-ecs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as Etargets from '@aws-cdk/aws-events-targets';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as ssm from '@aws-cdk/aws-ssm';
import { Stack, StackProps } from '@aws-cdk/core';
import * as kms from '@aws-cdk/aws-kms';
import { ManagedPolicy } from '@aws-cdk/aws-iam';



export class ServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
       const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvention = appname + "-" + environment

    const vpc =  ec2.Vpc.fromLookup(this, this.node.tryGetContext('vpcname') + "-"+ environment.toLocaleUpperCase,{isDefault: false, vpcName: this.node.tryGetContext('vpclookupname-'+environment)}
)
    const ecsSG = new ec2.SecurityGroup(this, namingconvention+"-ecs-sg-outboundonly", {
      vpc, 
      description: 'OutBoundOnly',
      allowAllOutbound: true   // Can be set to false
    });
    
    // The code that defines your stack goes here

    const cluster = new ecs.Cluster(this, namingconvention+'-Cluster', {
      vpc,
      containerInsights: true,
    });
    const keyARN = ssm.StringParameter.valueForStringParameter(
      this,namingpath + '/phase0/kmskey');
const key=kms.Key.fromKeyArn(this,"key-"+environment,keyARN)
const execRole = new iam.Role(this, namingconvention + '-TaskExecutionRole-', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
})


execRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, namingconvention + "-managedPolicy", 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'))
const secretmanagerARN = ssm.StringParameter.valueForStringParameter(
  this, namingpath + '/phase0/secretmanager');
const appSecretmanager = secretsmanager.Secret.fromSecretArn(this, namingconvention + "-secretmanager", secretmanagerARN)





const taskdef= new ecs.TaskDefinition(this, "task-"+namingconvention, {
  memoryMiB: "512",
  cpu:"256",
  compatibility: ecs.Compatibility.FARGATE,
  networkMode: ecs.NetworkMode.AWS_VPC,
  executionRole: execRole
  })
  appSecretmanager.grantRead(execRole)
  appSecretmanager.grantRead(taskdef.taskRole)
  key.grantDecrypt(execRole)
  key.grantDecrypt(taskdef.taskRole)
  taskdef.addContainer("container-"+namingconvention, {

    image:ecs.ContainerImage.fromAsset("AIS/WebSocketReader/"),
    cpu:256,
    memoryLimitMiB:512,
    logging: ecs.LogDrivers.awsLogs( { 
    logRetention:RetentionDays.ONE_MONTH,
    streamPrefix: namingconvention
    })
    })

    const ecsService = new ecs.FargateService(this, 'AIS-Service', {
      cluster: cluster,
      taskDefinition: taskdef,
      assignPublicIp: false,
      desiredCount: 1,
      securityGroup: ecsSG,
    });
ecsService.autoScaleTaskCount({ maxCapacity: 1 }).scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 80
});

    taskdef.taskRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this,"fulls3access",""))

}}
