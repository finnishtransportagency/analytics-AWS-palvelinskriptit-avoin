#!/bin/bash

#Script to get current task defintion, replicate it with new container version and add to revision number
set -e

TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition "$TASK_FAMILY" --region "$AWS_DEFAULT_REGION")
NEW_TASK_DEFINTIION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$ECR_IMAGE" '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities)')
aws ecs register-task-definition --region "us-east-1" --cli-input-json "$NEW_TASK_DEFINTIION"