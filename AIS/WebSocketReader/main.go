	package main

	import (
		"bytes"
		"compress/gzip"
		"crypto/rand"
		"encoding/base64"
		"encoding/hex"
		"errors"
		"encoding/json"
		"flag"
		"io"
		"log"
		"net/http"
		"net/url"
		"os"
		"os/signal"
		"strconv"
		"sync"
		"time"
		"strings"
		//"fmt"
		"github.com/aws/aws-sdk-go/aws"
		"github.com/aws/aws-sdk-go/aws/session"
		"github.com/aws/aws-sdk-go/service/s3/s3manager"
		"github.com/gorilla/websocket"
		"github.com/aws/aws-sdk-go/service/ssm"
	)

	//var addr = flag.String("addr", "wss://haproxy.liikennevirasto.fi:3005/public-parsed-data", "wss://haproxy.liikennevirasto.fi:3005/public-parsed-data")
	var rawList = rawStructList{}
	var parsedList = parsedStructList{}
	var s3bucket string = "aistestbucket"
	var lock = sync.Mutex{}
	var parsedlock =sync.Mutex{}
	var uusername string ="user" 
	var upassword string ="pass" 
	var messagelimit= 2000
	var bucket_region= "eu-central-1"
	var host= "host"
	const errorfloat=1000000

	/*****Data from websocket*******/




	/*******************************/

	/***** raw structure for JSON and internal objects*********/

	type rawStructList struct {
		Messages struct {
			MessagesWithStamp [] rawMessage `json:"Messages"`
		} `json:"AISRawMessages"`
	}

	type rawMessage struct {
			ProcessTimestamp int  `json:"processTimestamp"`
			Message     []string `json:"message"`
		} 

	/*******************************/

	/***** Parsed  structure  and internal objects*********/

	type parsedStructList struct {
		Messages struct {
			ParsedStructMessages [] parsedMessage `json:"Messages"`
		} `json:"AISParsedmessages"`
	}

	type parsedMessage struct {
			hexState *string `json:"Communication state in hex,omitempty"`
			sDimension *shipDimensions `json:"Dimension of ship/reference for position,omitempty"` //should this be a,b,c,d (int) struct? 
			ETA *int `json:"ETA [MMDDHHmm],omitempty"`
			Longitude *float32 `json:"Longitude,omitempty"`
			Latitude *float32 `json:"Latitude,omitempty"`
			Name *string `json:"Name,omitempty"`
			Destination *string `json:"Destination,omitempty"` 
			Vid *string `json:"Vendor ID in hex,omitempty"`
			//Following sseem to be optional integer flags
			Asensor *int `json:"Altitude sensor,omitempty"`
			Amodeflag *int `json:"Assigned mode flag,omitempty"`
			CBBandFlag *int `json:"Class B band flag,omitempty"`
			CBDisFlag *int `json:"Class B display flag,omitempty"`
			CBDSCFlag *int `json:"Class B DSC flag,omitempty"`
			CBMessageFlag *int `json:"Class B Message 22 flag,omitempty"`
			CBUnitFlag *int `json:"Class B unit flag,omitempty,omitempty"`
			ComStateSelector *int `json:"Communication state selector,omitempty"`
			DTE *int `json:"DTE,omitempty"`
			Nstatus *int `json:"Navigational status,omitempty"`
			Pnumber *int `json:"Part number,omitempty"`
			PosAccuracy *int `json:"Position accuracy,omitempty"`
			PosLatency *int `json:"Position latency,omitempty"`
			RFlag *int `json:"RAIM-flag,omitempty"`
			SmanI *int `json:"Special manoeuvre indicator,omitempty"`
			PFDT *int `json:"Type of electronic position fixing device,omitempty"`
			TSG *int `json:"Type of ship and cargo type,omitempty"`
			//not added to matcher and not documented
			Callsign *string `json:"Call sign,omitempty"`
			AISVersion *int `json:"AIS Version,omitempty"`
			rateOfTurn *int `json:"Rate of turn ROTAIS,omitempty"`
			MessageID *int `json:"Message ID,omitempty"`
			Repeati *int `json:"Repeat indicator,omitempty"`
			Spare *int `json:"Spare,omitempty"`
			IMONumber *int64 `json:"IMO number,omitempty"`
			EtimeStamp *int64 `json:"Ext_timestamp,omitempty"`			
			TimeStamp  *int64 `json:"Time stamp,omitempty"`
			UID  *int64 `json:"User ID,omitempty"`
			TrueHeading *float32`json:"True heading,omitempty"`
			COG *float32 `json:"COG,omitempty"`
			SOG *float32 `json:"SOG,omitempty"`
			TurnRate *int  `json:"Rate of Turn,omitempty"`
			MPSD *float32  `json:"Maximum present static draught,omitempty"`
			GNSSAltitude *int `json:"Altitude (GNSS),omitempty"`
		}
	type shipDimensions struct {
		A int `json:"A"`
		B int `json:"B"`
		C int `json:"C"`
		D int `json:"D"`
	}


	/*******************************/

	type aISData struct {
		Data struct {
			Raw    []string `json:"raw"`
			Parsed string   `json:"parsed"`
		} `json:"data"`
	}


	
	/*
	Generates S3 filepath for parsed and raw data depending on bool value. Path also includes date format and filename includes current time in nanoseconds, random hex and AIS.JSON.GZ since data will be compressed
	*/
	func StoragePathAndFileNaming(parsed bool) string {
		var s3prefix string
		currentTime := time.Now()
		var dateSaltprefix string = currentTime.Format("2006/01/02") + "/" + strconv.FormatInt(time.Now().UnixNano(), 10) + randomHex() + "AIS.json.gz"
		if parsed == true {
			s3prefix = "parsed/" + dateSaltprefix
		} else {
			s3prefix = "raw/" + dateSaltprefix
		}
		return s3prefix
	}

	func compressGZ(w io.Writer, data []byte) error {
		gzw, err := gzip.NewWriterLevel(w, gzip.BestCompression)
		defer gzw.Close()
		gzw.Write(data)
		gzw.Flush()
		return err
	}

	func initDumpToS3 (parsed bool) {
		//log.Println("initing dump parsed:", parsed)
		var buf bytes.Buffer
		var JsonbyteDump []byte
		
		if (parsed){
		JsonbyteDump, _ = json.Marshal(parsedList)
		} else {
		JsonbyteDump, _ = json.Marshal(rawList)
		}
		var storagePath = StoragePathAndFileNaming(parsed) // data is not parsed type so false
		gzErr := compressGZ(&buf, JsonbyteDump)
		if gzErr != nil {
			log.Println("Could not dump gunzip",gzErr)
		} else {
			go dumpToS3(buf,storagePath)
		}
	}
	func dumpToS3(buf bytes.Buffer, path string) { 
		log.Println("Starting to dump")
		s, err := session.NewSession(&aws.Config{Region: aws.String(bucket_region)})
		uploader := s3manager.NewUploader(s)
		if err != nil {
			log.Println(err)
		}
		_, errs := uploader.Upload(&s3manager.UploadInput{
			Bucket: aws.String(s3bucket),
			Key:    aws.String(path),
			Body:   bytes.NewReader(buf.Bytes()),
		})
		if errs != nil {
			log.Println(errs)
	}
	}
	/*
	1) get data to struct so that we have raw and parsed ones
	2) extract data from struct
	3.1 add raw data to list
	3.2 add parsed data to list
	3.3 when list size reaces defined size dump data to S3 raw in /raw "folder" & parsed in "parsed folder"
	*/
	func messageprosessor(byteMessage []byte, test bool) {
		structuredData := stringMessageToStruct(byteMessage)         // 1
		rawData, parsedData := extractDataFromStruct(structuredData) // 2
		log.Println("prosessor:",parsedData)
		log.Println(len(parsedData))
		if (len(rawData)>0) {
			go rawDataprocessLogic(rawData,test)                                 //3.1, 3.3
		}
		if (len(parsedData)>0) {
			go parsedDataprocessLogic(parsedData,test)                           // 3.2, 3.3
		}
	}

	func getrawStructList() rawStructList {
		return rawList
	}

	func extractDataFromStruct(ais aISData) ([]string, string) {	
		return ais.Data.Raw, ais.Data.Parsed
	}

	func stringMessageToStruct(byteMessage []byte) aISData {
		strucMessage := aISData{}
		json.Unmarshal(byteMessage, &strucMessage)
		return strucMessage
	}

	/**
	Creates messageobject holding array of messages 
	*/
	func rawMessageObjectCreator(rawData []string) rawMessage {
		var newMessage  rawMessage
		for _, rawMessage:= range rawData{
			newMessage.Message=append(newMessage.Message,rawMessage)		
		}
		newMessage.ProcessTimestamp= int(time.Now().Unix())
		return newMessage
	}

	/**
	raw data is added to slice (golang array) inside lock so only on thread can add content to list at the time. If list has reached required size slice will be passed to S3 dumping function
	*/

	func rawDataprocessLogic(rawData []string, test bool) bool {
		lock.Lock()
		defer lock.Unlock()
		var newStrucutredRawMessage rawMessage=rawMessageObjectCreator(rawData) 	
		rawList.Messages.MessagesWithStamp=append(rawList.Messages.MessagesWithStamp,newStrucutredRawMessage)
		//fmt.Printf("len=%d cap=%d %v\n", len(rawList.Messages.MessagesWithStamp), cap(rawList.Messages.MessagesWithStamp), rawList.Messages.MessagesWithStamp)	
		log.Println("RawListSize",len(rawList.Messages.MessagesWithStamp))
		if (len(rawList.Messages.MessagesWithStamp)>=messagelimit) { 
			var parsed=false
			if (!test){
				log.Println("initing Raw dumping to s3")
				initDumpToS3(parsed)
			} 
			rawList=rawStructList{}
			return true //tells that list was dumped to s3
		}
		return false
	}

	func parsedDataprocessLogic(parsedData string, test bool) bool {
		parsedlock.Lock()
		defer parsedlock.Unlock() 
		var newStrucutredParsedMessage parsedMessage=parsedMessageObjectConverter(parsedData)
		parsedList.Messages.ParsedStructMessages=append(parsedList.Messages.ParsedStructMessages,newStrucutredParsedMessage)
		log.Println("ParsedListSize",len(parsedList.Messages.ParsedStructMessages))
		if (len(parsedList.Messages.ParsedStructMessages)>=messagelimit) {
			var parsed=true
				if (!test){
					log.Println("initing Parsed dumping to s3")
					initDumpToS3(parsed)			
				}
				parsedList=parsedStructList{}
				return true
		}
		return false
	}

	/**
	Converts
	*/

	func parsedMessageObjectConverter(parsedData string) parsedMessage {
		var splittedData=strings.Split(parsedData, "|")
		var newParsedMessage= parsedMessage{}
		newParsedMessage=matchingloop(newParsedMessage,splittedData)
		return newParsedMessage
	}



	func getsplittedFloatValue(keyvaluepair string ) (float32,error) {
		var splittedpair=strings.Split(keyvaluepair,"§")
		if len(splittedpair) !=2 {
			log.Println("failed to parse float value")
			return 0,errors.New("failed to parse float value")
		}
		longstring := splittedpair[1]
		longval, err:= strconv.ParseFloat(longstring,32)
		if err != nil {
			log.Println("failed to convert float")
			return 0, errors.New("failed to parse float value")
			
		} else {
			return float32(longval),nil
		} 

	}

	func getsplittedStringValue(keyvaluepair string ) (string,error) {
		var splittedpair=strings.Split(keyvaluepair,"§")
		if len(splittedpair) !=2 {
			return "",errors.New("Failed to parse String")
		}
		return splittedpair[1],nil
	}	

	//Call sign
//maybe if _, err := rand.Read(bytes); err != nil {
	//// remember try catch this
	func matchingloop(newMessage parsedMessage, splitted []string) parsedMessage {
		for _, keyvaluepair:= range splitted{   
				//Strings
				if (strings.Contains(keyvaluepair,"Communication state in hex")) {
					sValue,err:=getsplittedStringValue(keyvaluepair)
					if (err!=nil){
						log.Println(err)
					} else { 
					newMessage.hexState=&sValue
					}			
				} else if (strings.Contains(keyvaluepair,"Name")) {
					sValue,err:=getsplittedStringValue(keyvaluepair)
					if (err!=nil){
						log.Println(err)
					} else { 
					newMessage.Name=&sValue
					}
				} else if (strings.Contains(keyvaluepair,"Call sign")) {
					sValue,err:=getsplittedStringValue(keyvaluepair)
					if (err!=nil){
						log.Println(err)
					} else { 
						newMessage.Callsign=&sValue
					}
					} else if (strings.Contains(keyvaluepair,"Destination")) {					
					sValue,err:=getsplittedStringValue(keyvaluepair)
					if (err!=nil){
						log.Println(err)
					} else { 
						newMessage.Destination=&sValue
					}
				} else if (strings.Contains(keyvaluepair,"Vendor ID in hex")) {
					sValue,err:=getsplittedStringValue(keyvaluepair)
					if (err!=nil) {
						log.Println(err)
					} else { 
					newMessage.Vid=&sValue
					} //Ship dimension
				} else if (strings.Contains(keyvaluepair,"Dimension of ship/reference for position")) {
					sDime,err:=getDimensions(keyvaluepair) 
					if (err!=nil){
						log.Println(err)
					} else { 
					newMessage.sDimension=&sDime
					} //floats
				}  else if (strings.Contains(keyvaluepair,"Longitude")) {
					floater,err:=getsplittedFloatValue(keyvaluepair)
					if err ==nil {	
						newMessage.Longitude=&floater
					}
				} else if (strings.Contains(keyvaluepair,"Latitude")) {
					floater,err:=getsplittedFloatValue(keyvaluepair)
					if err == nil {
							newMessage.Latitude=&floater
					}
				}  else if (strings.Contains(keyvaluepair,"True heading")) {
					floater,err:=getsplittedFloatValue(keyvaluepair)
					if err ==nil {	
						newMessage.TrueHeading=&floater
					}
				}  else if (strings.Contains(keyvaluepair,"COG")) {
						floater,err:=getsplittedFloatValue(keyvaluepair)
						if err ==nil {	
							newMessage.COG=&floater
						}						
				}  else if (strings.Contains(keyvaluepair,"SOG")) {
					floater,err:=getsplittedFloatValue(keyvaluepair)
					if err ==nil {	
						newMessage.SOG=&floater
					}			
				 // Integers
				} else if (strings.Contains(keyvaluepair,"Rate of turn ROTAIS")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if err ==nil {	
					newMessage.TurnRate=&iValue
				}						
			 
				} else if (strings.Contains(keyvaluepair,"Maximum present static draught")) {
					floater,err:=getsplittedFloatValue(keyvaluepair)
					if err ==nil {	
						newMessage.MPSD=&floater
					}						
	 
				}	 else if (strings.Contains(keyvaluepair,"ETA [MMDDHHmm]")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil) {
						log.Println("Fatal:",err)
					} else { 
					newMessage.ETA=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Altitude sensor")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.Asensor=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Assigned mode flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.Amodeflag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Class B band flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.CBBandFlag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Class B DSC flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.CBDSCFlag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Class B display flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.CBDisFlag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Class B Message 22 flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.CBMessageFlag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Class B unit flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.CBUnitFlag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Communication state selector")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
					newMessage.ComStateSelector=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"DTE")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){

						log.Println("Fatal:",err)
					} else { 
						newMessage.DTE=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Navigational status")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						 newMessage.Nstatus=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Part number")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.Pnumber=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Position accuracy")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.PosAccuracy=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Position latency")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.PosLatency=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"RAIM-flag")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.RFlag=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Special manoeuvre indicator")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.SmanI=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"Type of electronic position fixing device")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.PFDT=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"AIS version indicator")) {
						iValue,err:=getsplittedIntegerValue(keyvaluepair)
						if (err!=nil){
							log.Println("Fatal:",err)
						} else { 
							newMessage.AISVersion=&iValue
						}
				} else if (strings.Contains(keyvaluepair,"Message ID")) {
							iValue,err:=getsplittedIntegerValue(keyvaluepair)
							if (err!=nil){
								log.Println("Fatal:",err)
							} else { 
								newMessage.MessageID=&iValue
							}	
					
				} else if (strings.Contains(keyvaluepair,"Repeat indicator")) {
						iValue,err:=getsplittedIntegerValue(keyvaluepair)
						if (err!=nil){
							log.Println("Fatal:",err)
						} else { 
							newMessage.Repeati=&iValue
						}				
				} else if (strings.Contains(keyvaluepair,"Spare")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.Spare=&iValue
					}	
								
				} else if (strings.Contains(keyvaluepair,"Type of ship and cargo type")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.TSG=&iValue
					}
				} else if (strings.Contains(keyvaluepair,"IMO number")) {
					iValue,err:=getsplittedInteger64Value(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.IMONumber=&iValue
					}
				
				}	 else if (strings.Contains(keyvaluepair,"Ext_timestamp")) {
					iValue,err:=getsplittedInteger64Value(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.EtimeStamp=&iValue
					}
				
				} 	else if (strings.Contains(keyvaluepair,"Time stamp")) {
						iValue,err:=getsplittedInteger64Value(keyvaluepair)
						if (err!=nil){
							log.Println("Fatal:",err)
					} else { 
						newMessage.TimeStamp=&iValue
					}
				} 	else if (strings.Contains(keyvaluepair,"User ID")) {
					iValue,err:=getsplittedInteger64Value(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.UID=&iValue
				}
				} else if (strings.Contains(keyvaluepair,"Altitude (GNSS)")) {
					iValue,err:=getsplittedIntegerValue(keyvaluepair)
					if (err!=nil){
						log.Println("Fatal:",err)
					} else { 
						newMessage.GNSSAltitude=&iValue
				}
				} else {
						log.Println("FATAL: Could not match value-key-pair",keyvaluepair)
						log.Println(keyvaluepair)
				}
			}
		return newMessage
	}


	//AIS version indicator

	/**
	splits keyvalue pair that contains a,b,c,d info of the vessel
	second split splits a,b,c,d to their own pairs
	which we try to match and import to ships dimension structure and return it
	*/

	func getDimensions(keyvaluepair string ) (shipDimensions,error) {
		var newDimensions = shipDimensions{} 
		var splittedpair=strings.Split(keyvaluepair,"§")
		if len(splittedpair) !=2 {
			return newDimensions,errors.New("failed to split dimension keyvalue pair")
		}
		var splittedValues=strings.Split(splittedpair[1],",")
		if len(splittedValues) < 1 {
			return newDimensions,errors.New("failed to split dimension keyvalue pair")
		}
		for _, dim:= range splittedValues{
			if (strings.Contains(dim,"A")) {
				integerValue, err:=givedimensionvalue(dim)
				if err !=nil {
					log.Println("Fatal could not parse A", dim,err)
					return newDimensions,err
				}
				newDimensions.A=integerValue

			} else if (strings.Contains(dim,"B")) {
				integerValue, err:=givedimensionvalue(dim)
				if err !=nil {
					log.Println("Fatal could not parse B", dim,err)
					return newDimensions,err
				}
				newDimensions.B=integerValue
			
			} else if (strings.Contains(dim,"C")) {
				integerValue, err:=givedimensionvalue(dim)
				if err !=nil {
					log.Println("Fatal could not parse C", dim,err)
					return newDimensions,err
				}
				newDimensions.C=integerValue
				
			} else if (strings.Contains(dim,"D")) {
				integerValue, err:=givedimensionvalue(dim)
				if err !=nil {
					log.Println("Fatal could not parse D", dim,err)
					return newDimensions,err
				}
				newDimensions.D=integerValue				
			} else  {
				log.Println("Fatal: unknown dimension, read dimension other than abcd")
			}
		}
	return newDimensions,nil	
	}
func givedimensionvalue(dimL string) (int,error) {
	var splittedValue=strings.Split(dimL,"=")
	if len(splittedValue) != 2{
		log.Println("failed to read dimension value",dimL	)
		return -1, errors.New("failed to read dimension value")
	}
	integerValue, err := strconv.Atoi(splittedValue[1])
	if (err!= nil){
		log.Println("Fatal: error converting string dimension value to integer")
	}
	return integerValue,err
}
		
	func getsplittedIntegerValue (keyvaluepair string ) (int,error) {
		var splittedpair=strings.Split(keyvaluepair,"§")
		if len(splittedpair) !=2 {
			log.Println("failed integer,",keyvaluepair)
			return -1,errors.New("failed to split integer keyvalue pair: ")
		}
		return strconv.Atoi(splittedpair[1])
	}

	func getsplittedInteger64Value (keyvaluepair string ) (int64,error) {
		var splittedpair=strings.Split(keyvaluepair,"§")
		if len(splittedpair) !=2 {
			return -1,errors.New("failed to split integer keyvalue pair")
		 }
		return strconv.ParseInt(splittedpair[1], 10, 64)
	}

	func randomHex() string {
		bytes := make([]byte, 10)
		if _, err := rand.Read(bytes); err != nil {
			log.Fatal("randomhexinsert:", err)
			return ""
		}
		return hex.EncodeToString(bytes)
	}

	//!!Check from client that they dont want timestamp with rawdata or is it included to raw data!
	/*
	Idea is to read messages from websocket stream in nob-blocking way which means reading data in and start thread to process the data
	raw data will not be processed. it will be added as is in single string. other data will be parsed so that it can be handeled as objects
	Data  will be to add data to list until desired amount of input is added to list. When list reaches capacity it will take a lock on inserting data to list and dump data to S3.
	*/

	func restartConn(){
		//startConnect() 
	}
	

	func getSecrets(){

		sess, err := session.NewSessionWithOptions(session.Options{
			Config:            aws.Config{Region: aws.String("eu-central-1")},
			SharedConfigState: session.SharedConfigEnable,
		  })
		  if err != nil {
			log.Println(err)
		  }
		keyname := "AISParameters"
		ssmsvc := ssm.New(sess, aws.NewConfig().WithRegion("eu-central-1"))
		withDecryption := false
		param, err := ssmsvc.GetParameter(&ssm.GetParameterInput{
		  Name:           &keyname,
		  WithDecryption: &withDecryption,
		})
		if err!=nil {
			log.Println("Falling back to hardcoded credentials, error: ",err)
		}

		value := *param.Parameter.Value
		var splittedvalue = strings.Split(value,",")
		s3bucket=splittedvalue[0]
		uusername=splittedvalue[1]
		upassword=splittedvalue[2]
		host=splittedvalue[3]
	}



	func main() {
			getSecrets()
			startConnect()
	}


	func startConnect() {
	/*	defer func() {
		 restartConn()
		}()*/
		var queryString= "username="+uusername+"&passwd="+upassword 
		customHeader := http.Header{}
		customHeader.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(uusername+":"+upassword)))
		flag.Parse()
		log.SetFlags(0)
		interrupt := make(chan os.Signal, 1)
		signal.Notify(interrupt, os.Interrupt)
		u := url.URL{Scheme: "wss", Host: host , Path: "raw-and-parsed-data", RawQuery: queryString}
		log.Printf("connecting to %s", u.String())
		c, _, err := websocket.DefaultDialer.Dial(u.String(), customHeader)
		if err != nil {
			log.Fatal("dial:", err)
		}
		defer c.Close()
		done := make(chan struct{})
		go func() {
			defer close(done)
			//c.SetReadLimit(maxMessageSize)
			//c.SetReadDeadline(time.Now().Add(pongWait))
			//c.SetPongHandler(func(string) error { c.SetReadDeadline(time.Now().Add(pongWait)); return nil })
			for {
				_, message, err := c.ReadMessage()
				if err != nil {
					log.Println("read:", err)
					return
				}
				go messageprosessor(message,false) //sends message and informs messageinsert is not a test
				//log.Printf("recv: %s", message) //debug
			}
		}()
		//mux := sync.Mutex{}
		//mux.Lock()
		//mux.Lock()
		time.Sleep( 3* time.Second) //for testing only executes 30 seconds should be changed to inifite or if signal is received
		}


		const (
			// Time allowed to write a message to the peer.
			writeWait = 10 * time.Second
		
			// Time allowed to read the next pong message from the peer.
			pongWait = 60 * time.Second
		
			// Send pings to peer with this period. Must be less than pongWait.
			pingPeriod = (pongWait * 9) / 10
		
			// Maximum message size allowed from peer.
			maxMessageSize = 512
		)
