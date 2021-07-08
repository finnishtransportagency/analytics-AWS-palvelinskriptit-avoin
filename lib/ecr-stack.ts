import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import { RemovalPolicy } from '@aws-cdk/core';
import {StringParameter} from '@aws-cdk/aws-ssm';

export class ECRStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvetion = appname + "-" + environment

    const fargaterepo = new ecr.Repository(this, namingconvetion + "fargatetaskrepository", {
      repositoryName:  appname+ "-"+environment ,
      removalPolicy: RemovalPolicy.RETAIN,
      imageScanOnPush:true
    })

    new StringParameter(this, namingconvetion + '-fargaterepoarnparameter', {
      parameterName: namingpath + '/phase0/fargaterepoarn',
      description: 'arn for ' +appname +" fargate task repository",
      stringValue: fargaterepo.repositoryArn,
    })
    }
  }

