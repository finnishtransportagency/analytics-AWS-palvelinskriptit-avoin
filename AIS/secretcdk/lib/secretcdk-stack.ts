
import * as cdk from '@aws-cdk/core';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as kms from '@aws-cdk/aws-kms';
import * as ssm from '@aws-cdk/aws-ssm';

export class SecretcdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  
    const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvention = appname + "-" + environment
    const key = new kms.Key(this, namingconvention + -'KMS');
    const secret = new secretsmanager.Secret(this, namingconvention + '-AppSecrets',
      {
        generateSecretString: {
          secretStringTemplate: '{"gittoken": "token"}',
          generateStringKey: 'secretstring'
        },
      },
    );
    new ssm.StringParameter(this, namingconvention + '-Secrretparameters', {
      parameterName: namingpath + '/phase0/secretmanager',
      description: 'ARN of secretmanager',
      stringValue: secret.secretArn
    })

    new ssm.StringParameter(this, namingconvention + 'kmskey', {
      parameterName: namingpath + '/phase0/kmskey',
      description: 'kmskeyarn',
      stringValue: key.keyArn
    })
    new ssm.StringParameter(this, namingconvention + '-Environment', {
      parameterName: '/phase0/environment',
      description: 'Environment',
      stringValue: environment
    })
  }
}
