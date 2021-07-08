import { ServiceStack } from './service-stack';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { Construct, Stage, Stack, StackProps, StageProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction,ShellScriptAction } from '@aws-cdk/pipelines';
import * as ca from '@aws-cdk/aws-codepipeline-actions'
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as ssm from '@aws-cdk/aws-ssm';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';


interface stageprops extends StageProps {
  environment:string
  appname:string
}
class ApplicationStageR extends Stage {
  constructor(scope: Construct, id: string, props: stageprops) {
    super(scope, id, props);
    const environment = props.environment
    new ServiceStack(this, props.appname+'-service-'+environment,{ env:props.env
    });
  }
}

interface ServiceStackProps extends cdk.StackProps {

}
export class CICDStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);
    const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvention = appname + "-" + environment
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const secretmanagerARN = ssm.StringParameter.valueForStringParameter(
      this, namingpath + '/phase0/secretmanager');
      
    const pipeSecretmanager = secretsmanager.Secret.fromSecretArn(this, namingconvention + "-secretmanager", secretmanagerARN)

    codecommit.Repository.fromRepositoryArn
    var branch = "d"
    if (environment == "prod") {
      branch = "AIS"
    } else {
      branch = "AIS-"+environment
    }
    const codecommitrepoarn = ssm.StringParameter.valueForStringParameter(
      this, "/"+appname + '/phase0/codecommitarn');
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: namingconvention + '-Pipeline', cloudAssemblyArtifact,
      sourceAction: new ca.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: pipeSecretmanager.secretValueFromJson('github-token'),
        owner: this.node.tryGetContext('gitowner'),
        repo: this.node.tryGetContext('githubrepo'),
    }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
      }),
    });

    // This can be done to as many accounts and regions, however in this design we are following gitflow where each branch has own pipeline and we build everytime

   const predeployStage = pipeline.addApplicationStage(new ApplicationStageR(this, environment, {
      env: props.env,
      environment: environment,
      appname:appname
    }));

   
  }
}
