import { ServiceStack } from './service-stack';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { Construct, Stage, Stack, StackProps, StageProps } from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines';
import * as ca from '@aws-cdk/aws-codepipeline-actions'
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as ssm from '@aws-cdk/aws-ssm';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { CodeCommitSourceAction } from '@aws-cdk/aws-codepipeline-actions';


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
    const { accountId, region } = new cdk.ScopedAws(this);
    //TODO Tuotantoon pitää tehdä parameter käsin ennen deploymenttiä
    //const environment = ssm.StringParameter.valueForStringParameter(
      //this, '/phase0/environment');
    const environment = id.split("-")[2] //(accountId == "715757124801" ? "prod" : (accountId == "593223377027") ? "dev" : "undefined")
    
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvention = appname + "-" + environment
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const secretmanagerARN = ssm.StringParameter.valueForStringParameter(
      this, namingpath + '/phase0/secretmanager');
      
    const pipeSecretmanager = secretsmanager.Secret.fromSecretArn(this, namingconvention + "-secretmanager", secretmanagerARN)

   var branch = "d"
    if (environment == "prod") {
      branch = "AIS"
    } else {
      branch = "AIS-"+environment
    }

    const modernPipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      selfMutation: true,
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.gitHub(
          this.node.tryGetContext('gitowner')+"/"+this.node.tryGetContext('githubrepo'),
          branch,
          {authentication:pipeSecretmanager.secretValueFromJson('gittoken')}),
        installCommands: ['npm i -g npm@latest'],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });

    // This can be done to as many accounts and regions, however in this design we are following gitflow where each branch has own pipeline and we build everytime

   const predeployStage = modernPipeline.addStage(new ApplicationStageR(this, environment, {
      env: props.env,
      environment: environment,
      appname:appname
    }));

   
  }
}
