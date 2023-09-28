import sys
import json
import boto3
import time
import datetime
import os

s3 = boto3.resource('s3')

bucket=os.environ['bucket']
prefix=os.environ['prefix']

#path = 'vayla-file-load-bucket-prod/kieku/liikekirjanpito_toteuma/2023/09/14/'


def current_date_path():
    """
    Returns a date as string like:
    2022/12/16
    """
    dt = datetime.datetime.now()
    #return str(dt.year)+'/'+str(dt.month)+'/'+str(dt.day)+'/'
    return dt.strftime('%Y')+'/'+dt.strftime('%m')+'/'+dt.strftime('%d')+'/'


def check_filepath_s3(bucket, prefix):  
    #Checking if the file path exists
    
    s3 = boto3.client('s3')
    #pituus = 0
    
    kwargs = {'Bucket': bucket, 'Prefix': prefix}
    resp = s3.list_objects_v2(**kwargs)
    #pituus=len(resp)
    #print(pituus)
    return 'Contents' in resp
    
def lambda_handler(event, context):
    #print(current_date_path())
    #print(prefix)
    suffix = prefix + current_date_path()
    tulos = check_filepath_s3(bucket, suffix)
    if (tulos == False):
        print('EI TIEDOSTOA')
    
    return {
        'statusCode': 200,
        'body': json.dumps('END WITH SUCCESS')
    }