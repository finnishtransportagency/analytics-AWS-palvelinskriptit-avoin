import * as cxapi from '@aws-cdk/cx-api';
import * as AWS from 'aws-sdk';
import * as codebuild from 'aws-sdk/clients/codebuild';
import * as lambda from 'aws-sdk/clients/lambda';
import * as stepfunctions from 'aws-sdk/clients/stepfunctions';
import { DeployStackResult } from '../../../lib/api';
import { Template } from '../../../lib/api/util/cloudformation';
import { TestStackArtifact } from '../../util';
import { MockSdkProvider, SyncHandlerSubsetOf } from '../../util/mock-sdk';
export declare const STACK_ID = "stackId";
export declare function setupHotswapTests(): HotswapMockSdkProvider;
export declare function setupHotswapNestedStackTests(rootStackName: string): HotswapMockSdkProvider;
export declare function cdkStackArtifactOf(testStackArtifact?: Partial<TestStackArtifact>): cxapi.CloudFormationStackArtifact;
export declare function pushStackResourceSummaries(...items: AWS.CloudFormation.StackResourceSummary[]): void;
export declare function pushNestedStackResourceSummaries(stackName: string, ...items: AWS.CloudFormation.StackResourceSummary[]): void;
export declare function setCurrentCfnStackTemplate(template: Template): void;
export declare function addTemplateToCloudFormationLookupMock(stackArtifact: cxapi.CloudFormationStackArtifact): void;
export declare function stackSummaryOf(logicalId: string, resourceType: string, physicalResourceId: string): AWS.CloudFormation.StackResourceSummary;
export declare class HotswapMockSdkProvider {
    readonly mockSdkProvider: MockSdkProvider;
    constructor(rootStackName?: string);
    setUpdateStateMachineMock(mockUpdateMachineDefinition: (input: stepfunctions.UpdateStateMachineInput) => stepfunctions.UpdateStateMachineOutput): void;
    stubLambda(stubs: SyncHandlerSubsetOf<AWS.Lambda>, serviceStubs?: SyncHandlerSubsetOf<AWS.Service>, additionalProperties?: {
        [key: string]: any;
    }): void;
    getLambdaApiWaiters(): {
        [key: string]: any;
    };
    setUpdateProjectMock(mockUpdateProject: (input: codebuild.UpdateProjectInput) => codebuild.UpdateProjectOutput): void;
    stubAppSync(stubs: SyncHandlerSubsetOf<AWS.AppSync>): void;
    setInvokeLambdaMock(mockInvokeLambda: (input: lambda.InvocationRequest) => lambda.InvocationResponse): void;
    stubEcs(stubs: SyncHandlerSubsetOf<AWS.ECS>, additionalProperties?: {
        [key: string]: any;
    }): void;
    stubGetEndpointSuffix(stub: () => string): void;
    tryHotswapDeployment(stackArtifact: cxapi.CloudFormationStackArtifact, assetParams?: {
        [key: string]: string;
    }): Promise<DeployStackResult | undefined>;
}
