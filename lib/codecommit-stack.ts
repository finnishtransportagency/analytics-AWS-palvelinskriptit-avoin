import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import {StringParameter} from '@aws-cdk/aws-ssm';

export class CommitStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
   
    const appname = id.split("-")[0]
   
    const repo = new codecommit.Repository(this, appname ,{
        repositoryName: this.node.tryGetContext('codecommitname'),
        description: this.node.tryGetContext('codecommitname') + " repository"
    });


new StringParameter(this, appname + '-codecommitarnparameter', {
    parameterName:  "/"+appname + '/phase0/codecommitarn',
    description: 'arn for codecommit arn',
    stringValue: repo.repositoryArn,
  })
  }
}