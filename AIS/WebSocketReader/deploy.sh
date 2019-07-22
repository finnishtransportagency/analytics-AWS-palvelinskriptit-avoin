#!/bin/bash

#Script to get current task defintion, replicate it with new container version
set -e

ECS_TASK_DEFINITION_TEMPLATE="task.json"
ECS_TASK="task-ecs.json"
ECR_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${IMAGE_REPO_NAME}:${CODEBUILD_RESOLVED_SOURCE_VERSION}"

# Create task definition replica

sed -e "s;%ECR_IMAGE%;${ECR_IMAGE};g" ${ECS_TASK_DEFINITION_TEMPLATE} > ${ECS_TASK}
aws ecs register-task-definition --family ${TASK_FAMILY} --cli-input-json file://${ECS_TASK}

TASK_REPLICA=$(aws ecs describe-task-definition --task-definition ${TASK_FAMILY} | jq '.taskDefinition.revision')
DESIRED_COUNT=$(aws ecs describe-services --service ${SERVICE_NAME} --cluster ${ECS_CLUSTER} | jq '.services[0]|.desiredCount')

#Update new task version

aws ecs update-service --cluster ${ECS_CLUSTER} \
                       --service ${SERVICE_NAME} \
                       --task-definition ${TASK_FAMILY}:${TASK_REPLICA} \
                       --desired-count ${DESIRED_COUNT}
