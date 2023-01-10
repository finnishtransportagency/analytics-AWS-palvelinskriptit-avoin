"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceStack = void 0;
const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const ecs = require("@aws-cdk/aws-ecs");
const aws_logs_1 = require("@aws-cdk/aws-logs");
const ec2 = require("@aws-cdk/aws-ec2");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
const ssm = require("@aws-cdk/aws-ssm");
const kms = require("@aws-cdk/aws-kms");
const aws_iam_1 = require("@aws-cdk/aws-iam");
class ServiceStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const environment = id.split("-")[2];
        const appname = id.split("-")[0];
        const namingpath = '/' + appname + '/' + environment;
        const namingconvention = appname + "-" + environment;
        var vpcnamevariable = "nope";
        var vpcid;
        if (environment == "prod") {
            vpcnamevariable = this.node.tryGetContext('vpclookupname-prod');
            vpcid = this.node.tryGetContext('vpcid-prod');
        }
        else {
            vpcnamevariable = this.node.tryGetContext('vpclookupname-dev');
            vpcid = this.node.tryGetContext('vpcid-dev');
        }
        const vpc = ec2.Vpc.fromLookup(this, vpcnamevariable, { isDefault: false, vpcId: vpcid, vpcName: vpcnamevariable });
        const ecsSG = new ec2.SecurityGroup(this, namingconvention + "-ecs-sg-outboundonly", {
            vpc,
            description: 'OutBoundOnly',
            allowAllOutbound: true // Can be set to false
        });
        // The code that defines your stack goes here
        const cluster = new ecs.Cluster(this, namingconvention + '-Cluster', {
            vpc,
            containerInsights: true,
        });
        const keyARN = ssm.StringParameter.valueForStringParameter(this, namingpath + '/phase0/kmskey');
        const key = kms.Key.fromKeyArn(this, "key-" + environment, keyARN);
        const execRole = new iam.Role(this, namingconvention + '-TaskExecutionRole-', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
        execRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, namingconvention + "-managedPolicy", 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'));
        const secretmanagerARN = ssm.StringParameter.valueForStringParameter(this, namingpath + '/phase0/secretmanager');
        const appSecretmanager = secretsmanager.Secret.fromSecretArn(this, namingconvention + "-secretmanager", secretmanagerARN);
        const taskdef = new ecs.TaskDefinition(this, "task-" + namingconvention, {
            memoryMiB: "512",
            cpu: "256",
            compatibility: ecs.Compatibility.FARGATE,
            networkMode: ecs.NetworkMode.AWS_VPC,
            executionRole: execRole
        });
        appSecretmanager.grantRead(execRole);
        appSecretmanager.grantRead(taskdef.taskRole);
        key.grantDecrypt(execRole);
        key.grantDecrypt(taskdef.taskRole);
        taskdef.addContainer("container-" + namingconvention, {
            image: ecs.ContainerImage.fromAsset("AIS/WebSocketReader/"),
            cpu: 256,
            memoryLimitMiB: 512,
            logging: ecs.LogDrivers.awsLogs({
                logRetention: aws_logs_1.RetentionDays.ONE_MONTH,
                streamPrefix: namingconvention
            })
        });
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
        taskdef.taskRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromManagedPolicyArn(this, "fulls3access", "arn:aws:iam::aws:policy/AmazonS3FullAccess"));
        taskdef.taskRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromManagedPolicyArn(this, "secretmanageraccess", "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"));
    }
}
exports.ServiceStack = ServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZpY2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQXFDO0FBQ3JDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMsZ0RBQTREO0FBQzVELHdDQUF3QztBQUN4Qyw4REFBOEQ7QUFDOUQsd0NBQXdDO0FBRXhDLHdDQUF3QztBQUN4Qyw4Q0FBaUQ7QUFJakQsTUFBYSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDekMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVyQixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxHQUFHLE9BQU8sR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFBO1FBQ3BELE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUE7UUFFcEQsSUFBSSxlQUFlLEdBQUcsTUFBTSxDQUFBO1FBQzVCLElBQUksS0FBWSxDQUFBO1FBQ2hCLElBQUksV0FBVyxJQUFJLE1BQU0sRUFBRTtZQUN6QixlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtZQUMvRCxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUE7U0FDOUM7YUFBTTtZQUNMLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1lBQzlELEtBQUss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UztnQkFDcEMsWUFBWSxFQUFFLGdCQUFnQjthQUM3QixDQUFDO1NBQ0QsQ0FBQyxDQUFBO1FBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDN0QsT0FBTyxFQUFFLE9BQU87WUFDaEIsY0FBYyxFQUFFLE9BQU87WUFDdkIsY0FBYyxFQUFFLEtBQUs7WUFDckIsWUFBWSxFQUFFLENBQUM7WUFDZixhQUFhLEVBQUUsS0FBSztTQUNyQixDQUFDLENBQUM7UUFDUCxVQUFVLENBQUMsa0JBQWtCLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLEVBQUU7WUFDcEYsd0JBQXdCLEVBQUUsRUFBRTtTQUM3QixDQUFDLENBQUM7UUFFQyxPQUFPLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLHVCQUFhLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFDLGNBQWMsRUFBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUE7UUFDdkksT0FBTyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyx1QkFBYSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBQyxxQkFBcUIsRUFBQyxpREFBaUQsQ0FBQyxDQUFDLENBQUE7SUFDdkosQ0FBQztDQUFDO0FBcEZGLG9DQW9GRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGVjcyBmcm9tICdAYXdzLWNkay9hd3MtZWNzJztcbmltcG9ydCB7IExvZ0dyb3VwLCBSZXRlbnRpb25EYXlzIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ0Bhd3MtY2RrL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnQGF3cy1jZGsvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcbmltcG9ydCB7IFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBrbXMgZnJvbSAnQGF3cy1jZGsvYXdzLWttcyc7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5cblxuXG5leHBvcnQgY2xhc3MgU2VydmljZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIFxuICAgICAgIGNvbnN0IGVudmlyb25tZW50ID0gaWQuc3BsaXQoXCItXCIpWzJdXG4gICAgY29uc3QgYXBwbmFtZSA9IGlkLnNwbGl0KFwiLVwiKVswXVxuICAgIGNvbnN0IG5hbWluZ3BhdGggPSAnLycgKyBhcHBuYW1lICsgJy8nICsgZW52aXJvbm1lbnRcbiAgICBjb25zdCBuYW1pbmdjb252ZW50aW9uID0gYXBwbmFtZSArIFwiLVwiICsgZW52aXJvbm1lbnRcblxuICAgIHZhciB2cGNuYW1ldmFyaWFibGUgPSBcIm5vcGVcIlxuICAgIHZhciB2cGNpZDpcIi5hdmlcIlxuICAgIGlmIChlbnZpcm9ubWVudCA9PSBcInByb2RcIikge1xuICAgICAgdnBjbmFtZXZhcmlhYmxlID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3ZwY2xvb2t1cG5hbWUtcHJvZCcpXG4gICAgICB2cGNpZCA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCd2cGNpZC1wcm9kJylcbiAgICB9IGVsc2Uge1xuICAgICAgdnBjbmFtZXZhcmlhYmxlID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3ZwY2xvb2t1cG5hbWUtZGV2JylcbiAgICAgIHZwY2lkID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3ZwY2lkLWRldicpXG4gICAgfVxuICAgICBjb25zdCB2cGMgPSAgZWMyLlZwYy5mcm9tTG9va3VwKHRoaXMsIHZwY25hbWV2YXJpYWJsZSAse2lzRGVmYXVsdDogZmFsc2UsIHZwY0lkOiB2cGNpZCx2cGNOYW1lOnZwY25hbWV2YXJpYWJsZX1cbilcbiAgICBjb25zdCBlY3NTRyA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCBuYW1pbmdjb252ZW50aW9uK1wiLWVjcy1zZy1vdXRib3VuZG9ubHlcIiwge1xuICAgICAgdnBjLCBcbiAgICAgIGRlc2NyaXB0aW9uOiAnT3V0Qm91bmRPbmx5JyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUgICAvLyBDYW4gYmUgc2V0IHRvIGZhbHNlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gVGhlIGNvZGUgdGhhdCBkZWZpbmVzIHlvdXIgc3RhY2sgZ29lcyBoZXJlXG5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVjcy5DbHVzdGVyKHRoaXMsIG5hbWluZ2NvbnZlbnRpb24rJy1DbHVzdGVyJywge1xuICAgICAgdnBjLFxuICAgICAgY29udGFpbmVySW5zaWdodHM6IHRydWUsXG4gICAgfSk7XG4gICAgY29uc3Qga2V5QVJOID0gc3NtLlN0cmluZ1BhcmFtZXRlci52YWx1ZUZvclN0cmluZ1BhcmFtZXRlcihcbiAgICAgIHRoaXMsbmFtaW5ncGF0aCArICcvcGhhc2UwL2ttc2tleScpO1xuY29uc3Qga2V5PWttcy5LZXkuZnJvbUtleUFybih0aGlzLFwia2V5LVwiK2Vudmlyb25tZW50LGtleUFSTilcbmNvbnN0IGV4ZWNSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsIG5hbWluZ2NvbnZlbnRpb24gKyAnLVRhc2tFeGVjdXRpb25Sb2xlLScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2Vjcy10YXNrcy5hbWF6b25hd3MuY29tJylcbn0pXG5cblxuZXhlY1JvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tTWFuYWdlZFBvbGljeUFybih0aGlzLCBuYW1pbmdjb252ZW50aW9uICsgXCItbWFuYWdlZFBvbGljeVwiLCAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0FtYXpvbkVDU1Rhc2tFeGVjdXRpb25Sb2xlUG9saWN5JykpXG5jb25zdCBzZWNyZXRtYW5hZ2VyQVJOID0gc3NtLlN0cmluZ1BhcmFtZXRlci52YWx1ZUZvclN0cmluZ1BhcmFtZXRlcihcbiAgdGhpcywgbmFtaW5ncGF0aCArICcvcGhhc2UwL3NlY3JldG1hbmFnZXInKTtcbmNvbnN0IGFwcFNlY3JldG1hbmFnZXIgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldEFybih0aGlzLCBuYW1pbmdjb252ZW50aW9uICsgXCItc2VjcmV0bWFuYWdlclwiLCBzZWNyZXRtYW5hZ2VyQVJOKVxuXG5cblxuXG5cbmNvbnN0IHRhc2tkZWY9IG5ldyBlY3MuVGFza0RlZmluaXRpb24odGhpcywgXCJ0YXNrLVwiK25hbWluZ2NvbnZlbnRpb24sIHtcbiAgbWVtb3J5TWlCOiBcIjUxMlwiLFxuICBjcHU6XCIyNTZcIixcbiAgY29tcGF0aWJpbGl0eTogZWNzLkNvbXBhdGliaWxpdHkuRkFSR0FURSxcbiAgbmV0d29ya01vZGU6IGVjcy5OZXR3b3JrTW9kZS5BV1NfVlBDLFxuICBleGVjdXRpb25Sb2xlOiBleGVjUm9sZVxuICB9KVxuICBhcHBTZWNyZXRtYW5hZ2VyLmdyYW50UmVhZChleGVjUm9sZSlcbiAgYXBwU2VjcmV0bWFuYWdlci5ncmFudFJlYWQodGFza2RlZi50YXNrUm9sZSlcbiAga2V5LmdyYW50RGVjcnlwdChleGVjUm9sZSlcbiAga2V5LmdyYW50RGVjcnlwdCh0YXNrZGVmLnRhc2tSb2xlKVxuICB0YXNrZGVmLmFkZENvbnRhaW5lcihcImNvbnRhaW5lci1cIituYW1pbmdjb252ZW50aW9uLCB7XG5cbiAgICBpbWFnZTplY3MuQ29udGFpbmVySW1hZ2UuZnJvbUFzc2V0KFwiQUlTL1dlYlNvY2tldFJlYWRlci9cIiksXG4gICAgY3B1OjI1NixcbiAgICBtZW1vcnlMaW1pdE1pQjo1MTIsXG4gICAgbG9nZ2luZzogZWNzLkxvZ0RyaXZlcnMuYXdzTG9ncyggeyBcbiAgICBsb2dSZXRlbnRpb246UmV0ZW50aW9uRGF5cy5PTkVfTU9OVEgsXG4gICAgc3RyZWFtUHJlZml4OiBuYW1pbmdjb252ZW50aW9uXG4gICAgfSlcbiAgICB9KVxuXG4gICAgY29uc3QgZWNzU2VydmljZSA9IG5ldyBlY3MuRmFyZ2F0ZVNlcnZpY2UodGhpcywgJ0FJUy1TZXJ2aWNlJywge1xuICAgICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiB0YXNrZGVmLFxuICAgICAgYXNzaWduUHVibGljSXA6IGZhbHNlLFxuICAgICAgZGVzaXJlZENvdW50OiAxLFxuICAgICAgc2VjdXJpdHlHcm91cDogZWNzU0csXG4gICAgfSk7XG5lY3NTZXJ2aWNlLmF1dG9TY2FsZVRhc2tDb3VudCh7IG1heENhcGFjaXR5OiAxIH0pLnNjYWxlT25DcHVVdGlsaXphdGlvbignQ3B1U2NhbGluZycsIHtcbiAgdGFyZ2V0VXRpbGl6YXRpb25QZXJjZW50OiA4MFxufSk7XG5cbiAgICB0YXNrZGVmLnRhc2tSb2xlLmFkZE1hbmFnZWRQb2xpY3koTWFuYWdlZFBvbGljeS5mcm9tTWFuYWdlZFBvbGljeUFybih0aGlzLFwiZnVsbHMzYWNjZXNzXCIsXCJhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9BbWF6b25TM0Z1bGxBY2Nlc3NcIikpXG4gICAgdGFza2RlZi50YXNrUm9sZS5hZGRNYW5hZ2VkUG9saWN5KE1hbmFnZWRQb2xpY3kuZnJvbU1hbmFnZWRQb2xpY3lBcm4odGhpcyxcInNlY3JldG1hbmFnZXJhY2Nlc3NcIixcImFybjphd3M6aWFtOjphd3M6cG9saWN5L0FtYXpvblNTTVJlYWRPbmx5QWNjZXNzXCIpKVxufX1cbiJdfQ==