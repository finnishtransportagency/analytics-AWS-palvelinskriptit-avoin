"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CICDStack = void 0;
const service_stack_1 = require("./service-stack");
const cdk = require("@aws-cdk/core");
const core_1 = require("@aws-cdk/core");
const pipelines = require("@aws-cdk/pipelines");
const codepipeline = require("@aws-cdk/aws-codepipeline");
const ssm = require("@aws-cdk/aws-ssm");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
class ApplicationStageR extends core_1.Stage {
    constructor(scope, id, props) {
        super(scope, id, props);
        const environment = props.environment;
        new service_stack_1.ServiceStack(this, props.appname + '-service-' + environment, { env: props.env
        });
    }
}
class CICDStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { accountId, region } = new cdk.ScopedAws(this);
        //TODO Tuotantoon pitää tehdä parameter käsin ennen deploymenttiä
        //const environment = ssm.StringParameter.valueForStringParameter(
        //this, '/phase0/environment');
        const environment = id.split("-")[2]; //(accountId == "715757124801" ? "prod" : (accountId == "593223377027") ? "dev" : "undefined")
        const appname = id.split("-")[0];
        const namingpath = '/' + appname + '/' + environment;
        const namingconvention = appname + "-" + environment;
        const sourceArtifact = new codepipeline.Artifact();
        const cloudAssemblyArtifact = new codepipeline.Artifact();
        const secretmanagerARN = ssm.StringParameter.valueForStringParameter(this, namingpath + '/phase0/secretmanager');
        const pipeSecretmanager = secretsmanager.Secret.fromSecretArn(this, namingconvention + "-secretmanager", secretmanagerARN);
        var branch = "d";
        if (environment == "prod") {
            branch = "AIS";
        }
        else {
            branch = "AIS-" + environment;
        }
        const modernPipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            selfMutation: true,
            synth: new pipelines.ShellStep('Synth', {
                input: pipelines.CodePipelineSource.gitHub(this.node.tryGetContext('gitowner') + "/" + this.node.tryGetContext('githubrepo'), branch, { authentication: pipeSecretmanager.secretValueFromJson('gittoken') }),
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
            appname: appname
        }));
    }
}
exports.CICDStack = CICDStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2ljZC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNpY2Qtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQStDO0FBQy9DLHFDQUFxQztBQUVyQyx3Q0FBZ0Y7QUFDaEYsZ0RBQWdEO0FBRWhELDBEQUEwRDtBQUMxRCx3Q0FBd0M7QUFDeEMsOERBQThEO0FBUTlELE1BQU0saUJBQWtCLFNBQVEsWUFBSztJQUNuQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWlCO1FBQ3pELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUE7UUFDckMsSUFBSSw0QkFBWSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFDLFdBQVcsR0FBQyxXQUFXLEVBQUMsRUFBRSxHQUFHLEVBQUMsS0FBSyxDQUFDLEdBQUc7U0FDM0UsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBS0QsTUFBYSxTQUFVLFNBQVEsWUFBSztJQUNsQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RELGlFQUFpRTtRQUNqRSxrRUFBa0U7UUFDaEUsK0JBQStCO1FBQ2pDLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQyw4RkFBOEY7UUFFbkksTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNoQyxNQUFNLFVBQVUsR0FBRyxHQUFHLEdBQUcsT0FBTyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUE7UUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLEdBQUcsR0FBRyxHQUFHLFdBQVcsQ0FBQTtRQUNwRCxNQUFNLGNBQWMsR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuRCxNQUFNLHFCQUFxQixHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTFELE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FDbEUsSUFBSSxFQUFFLFVBQVUsR0FBRyx1QkFBdUIsQ0FBQyxDQUFDO1FBRTlDLE1BQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGdCQUFnQixHQUFHLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUE7UUFFM0gsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFBO1FBQ2YsSUFBSSxXQUFXLElBQUksTUFBTSxFQUFFO1lBQ3pCLE1BQU0sR0FBRyxLQUFLLENBQUE7U0FDZjthQUFNO1lBQ0wsTUFBTSxHQUFHLE1BQU0sR0FBQyxXQUFXLENBQUE7U0FDNUI7UUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNsRSxZQUFZLEVBQUUsSUFBSTtZQUNsQixLQUFLLEVBQUUsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtnQkFDdEMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFDLEdBQUcsR0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsRUFDN0UsTUFBTSxFQUNOLEVBQUMsY0FBYyxFQUFDLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxFQUFDLENBQUM7Z0JBQ3JFLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFDO2dCQUN4QyxRQUFRLEVBQUU7b0JBQ1IsUUFBUTtvQkFDUixlQUFlO29CQUNmLGVBQWU7aUJBQ2hCO2FBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILDhKQUE4SjtRQUUvSixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksaUJBQWlCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNyRixHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDZCxXQUFXLEVBQUUsV0FBVztZQUN4QixPQUFPLEVBQUMsT0FBTztTQUNoQixDQUFDLENBQUMsQ0FBQztJQUdOLENBQUM7Q0FDRjtBQXJERCw4QkFxREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZXJ2aWNlU3RhY2sgfSBmcm9tICcuL3NlcnZpY2Utc3RhY2snO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ0Bhd3MtY2RrL2F3cy1lYzInO1xuaW1wb3J0IHsgQ29uc3RydWN0LCBTdGFnZSwgU3RhY2ssIFN0YWNrUHJvcHMsIFN0YWdlUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIHBpcGVsaW5lcyBmcm9tICdAYXdzLWNkay9waXBlbGluZXMnO1xuaW1wb3J0ICogYXMgY2EgZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJ1xuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lIGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ0Bhd3MtY2RrL2F3cy1zc20nO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnQGF3cy1jZGsvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCB7IENvZGVDb21taXRTb3VyY2VBY3Rpb24gfSBmcm9tICdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xuXG5cbmludGVyZmFjZSBzdGFnZXByb3BzIGV4dGVuZHMgU3RhZ2VQcm9wcyB7XG4gIGVudmlyb25tZW50OnN0cmluZ1xuICBhcHBuYW1lOnN0cmluZ1xufVxuY2xhc3MgQXBwbGljYXRpb25TdGFnZVIgZXh0ZW5kcyBTdGFnZSB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBzdGFnZXByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBwcm9wcy5lbnZpcm9ubWVudFxuICAgIG5ldyBTZXJ2aWNlU3RhY2sodGhpcywgcHJvcHMuYXBwbmFtZSsnLXNlcnZpY2UtJytlbnZpcm9ubWVudCx7IGVudjpwcm9wcy5lbnZcbiAgICB9KTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgU2VydmljZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG5cbn1cbmV4cG9ydCBjbGFzcyBDSUNEU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTZXJ2aWNlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIGNvbnN0IHsgYWNjb3VudElkLCByZWdpb24gfSA9IG5ldyBjZGsuU2NvcGVkQXdzKHRoaXMpO1xuICAgIC8vVE9ETyBUdW90YW50b29uIHBpdMOkw6QgdGVoZMOkIHBhcmFtZXRlciBrw6RzaW4gZW5uZW4gZGVwbG95bWVudHRpw6RcbiAgICAvL2NvbnN0IGVudmlyb25tZW50ID0gc3NtLlN0cmluZ1BhcmFtZXRlci52YWx1ZUZvclN0cmluZ1BhcmFtZXRlcihcbiAgICAgIC8vdGhpcywgJy9waGFzZTAvZW52aXJvbm1lbnQnKTtcbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IGlkLnNwbGl0KFwiLVwiKVsyXSAvLyhhY2NvdW50SWQgPT0gXCI3MTU3NTcxMjQ4MDFcIiA/IFwicHJvZFwiIDogKGFjY291bnRJZCA9PSBcIjU5MzIyMzM3NzAyN1wiKSA/IFwiZGV2XCIgOiBcInVuZGVmaW5lZFwiKVxuICAgIFxuICAgIGNvbnN0IGFwcG5hbWUgPSBpZC5zcGxpdChcIi1cIilbMF1cbiAgICBjb25zdCBuYW1pbmdwYXRoID0gJy8nICsgYXBwbmFtZSArICcvJyArIGVudmlyb25tZW50XG4gICAgY29uc3QgbmFtaW5nY29udmVudGlvbiA9IGFwcG5hbWUgKyBcIi1cIiArIGVudmlyb25tZW50XG4gICAgY29uc3Qgc291cmNlQXJ0aWZhY3QgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG4gICAgY29uc3QgY2xvdWRBc3NlbWJseUFydGlmYWN0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgpO1xuXG4gICAgY29uc3Qgc2VjcmV0bWFuYWdlckFSTiA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGb3JTdHJpbmdQYXJhbWV0ZXIoXG4gICAgICB0aGlzLCBuYW1pbmdwYXRoICsgJy9waGFzZTAvc2VjcmV0bWFuYWdlcicpO1xuICAgICAgXG4gICAgY29uc3QgcGlwZVNlY3JldG1hbmFnZXIgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldEFybih0aGlzLCBuYW1pbmdjb252ZW50aW9uICsgXCItc2VjcmV0bWFuYWdlclwiLCBzZWNyZXRtYW5hZ2VyQVJOKVxuXG4gICB2YXIgYnJhbmNoID0gXCJkXCJcbiAgICBpZiAoZW52aXJvbm1lbnQgPT0gXCJwcm9kXCIpIHtcbiAgICAgIGJyYW5jaCA9IFwiQUlTXCJcbiAgICB9IGVsc2Uge1xuICAgICAgYnJhbmNoID0gXCJBSVMtXCIrZW52aXJvbm1lbnRcbiAgICB9XG5cbiAgICBjb25zdCBtb2Rlcm5QaXBlbGluZSA9IG5ldyBwaXBlbGluZXMuQ29kZVBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIHNlbGZNdXRhdGlvbjogdHJ1ZSxcbiAgICAgIHN5bnRoOiBuZXcgcGlwZWxpbmVzLlNoZWxsU3RlcCgnU3ludGgnLCB7XG4gICAgICAgIGlucHV0OiBwaXBlbGluZXMuQ29kZVBpcGVsaW5lU291cmNlLmdpdEh1YihcbiAgICAgICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnZ2l0b3duZXInKStcIi9cIit0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnZ2l0aHVicmVwbycpLFxuICAgICAgICAgIGJyYW5jaCxcbiAgICAgICAgICB7YXV0aGVudGljYXRpb246cGlwZVNlY3JldG1hbmFnZXIuc2VjcmV0VmFsdWVGcm9tSnNvbignZ2l0dG9rZW4nKX0pLFxuICAgICAgICBpbnN0YWxsQ29tbWFuZHM6IFsnbnBtIGkgLWcgbnBtQGxhdGVzdCddLFxuICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICducG0gY2knLFxuICAgICAgICAgICducG0gcnVuIGJ1aWxkJyxcbiAgICAgICAgICAnbnB4IGNkayBzeW50aCcsXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIC8vIFRoaXMgY2FuIGJlIGRvbmUgdG8gYXMgbWFueSBhY2NvdW50cyBhbmQgcmVnaW9ucywgaG93ZXZlciBpbiB0aGlzIGRlc2lnbiB3ZSBhcmUgZm9sbG93aW5nIGdpdGZsb3cgd2hlcmUgZWFjaCBicmFuY2ggaGFzIG93biBwaXBlbGluZSBhbmQgd2UgYnVpbGQgZXZlcnl0aW1lXG5cbiAgIGNvbnN0IHByZWRlcGxveVN0YWdlID0gbW9kZXJuUGlwZWxpbmUuYWRkU3RhZ2UobmV3IEFwcGxpY2F0aW9uU3RhZ2VSKHRoaXMsIGVudmlyb25tZW50LCB7XG4gICAgICBlbnY6IHByb3BzLmVudixcbiAgICAgIGVudmlyb25tZW50OiBlbnZpcm9ubWVudCxcbiAgICAgIGFwcG5hbWU6YXBwbmFtZVxuICAgIH0pKTtcblxuICAgXG4gIH1cbn1cbiJdfQ==