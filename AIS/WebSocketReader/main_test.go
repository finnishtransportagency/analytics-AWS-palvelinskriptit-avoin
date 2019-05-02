package main

import (
	"encoding/json"
	"log"
	"reflect"
	"testing"
)

var dimensions = shipDimensions{}

func TestGetDimensions(t *testing.T) {
	dimensions.ADim = 8
	dimensions.BDim = 28
	dimensions.CDim = 4
	dimensions.DDim = 5
	keyvaluepair := "Dimension of ship/reference for position§A=8,B=28,C=4,D=5"
	expected := dimensions
	actual, err := GetDimensions(keyvaluepair)
	if actual != expected || err != nil {
		t.Errorf("ship dimensions parsing not what expected")
		log.Println(keyvaluepair, expected, actual)
	}
}

func TestParsedMessageObjectConverter(t *testing.T) {
	dimensions.ADim = 8
	dimensions.BDim = 28
	dimensions.CDim = 4
	dimensions.DDim = 5

	var message = "Communication state in hex§hex|Dimension of ship/reference for position§A=8,B=28,C=4,D=5|ETA [MMDDHHmm]§10|Longitude§24.5|Latitude§65.3|Name§name|Destination§valhalla|Vendor ID in hex§hexid|Altitude sensor§2|Assigned mode flag§3|" +
		"Class B band flag§4|Class B display flag§5|Class B DSC flag§6|Class B Message 22 flag§7|Class B unit flag§8|Communication state selector§9|DTE§10|Navigational status§11|Part number§12|Position accuracy§13|Position latency§14|RAIM-flag§15|Special manoeuvre indicator§16" +
		"|Type of electronic position fixing device§17|Type of ship and cargo type§18|Call sign§sign|AIS version indicator§20|Message ID§21|Repeat indicator§22|Spare§28|IMO number§23|Ext_timestamp§24|Time stamp§25|User ID§26|" +
		"True heading§13.2|COG§13.3|SOG§13.4|Rate of turn ROTAIS§-128|Maximum present static draught§13.5|Altitude (GNSS)§27"
	var expectedMessageObject = parsedMessage{}
	var HexState string = "hex"
	var SDimension shipDimensions = dimensions
	var ETA int = 10
	var Longitude float32 = 24.5
	var Latitude float32 = 65.3
	var Name string = "name"
	var Destination string = "Valhalla"
	var Vid string = "hexid"
	var Asensor int = 2
	var Amodeflag int = 3
	var CBBandFlag int = 4
	var CBDisFlag int = 5
	var CBDSCFlag int = 6
	var CBMessageFlag int = 7
	var CBUnitFlag int = 8
	var ComStateSelector int = 9
	var DTE int = 10
	var Nstatus int = 11
	var Pnumber int = 12
	var PosAccuracy int = 13
	var PosLatency int = 14
	var RFlag int = 15
	var SmanI int = 16
	var PFDT int = 17
	var TSG int = 18
	var Callsign string = "sing"
	var AISVersion int = 20
	var MessageID int = 21
	var Repeati int = 22
	var Spare int = 28
	var IMONumber int64 = 23
	var EtimeStamp int64 = 24
	var TimeStamp int64 = 25
	var UID int64 = 26
	var TrueHeading float32 = 13.2
	var COG float32 = 13.3
	var SOG float32 = 13.4
	var TurnRate int = -128
	var MPSD float32 = 13.5
	var GNSSAltitude int = 27

	expectedMessageObject.HexState = &HexState
	expectedMessageObject.SDimension = &SDimension
	expectedMessageObject.ETA = &ETA
	expectedMessageObject.Longitude = &Longitude
	expectedMessageObject.Latitude = &Latitude
	expectedMessageObject.Name = &Name
	expectedMessageObject.Destination = &Destination
	expectedMessageObject.Vid = &Vid
	expectedMessageObject.Asensor = &Asensor
	expectedMessageObject.Amodeflag = &Amodeflag
	expectedMessageObject.CBBandFlag = &CBBandFlag
	expectedMessageObject.CBDisFlag = &CBDisFlag
	expectedMessageObject.CBDSCFlag = &CBDSCFlag
	expectedMessageObject.CBMessageFlag = &CBMessageFlag
	expectedMessageObject.CBUnitFlag = &CBUnitFlag
	expectedMessageObject.ComStateSelector = &ComStateSelector
	expectedMessageObject.DTE = &DTE
	expectedMessageObject.Nstatus = &Nstatus
	expectedMessageObject.Pnumber = &Pnumber
	expectedMessageObject.PosAccuracy = &PosAccuracy
	expectedMessageObject.PosLatency = &PosLatency
	expectedMessageObject.RFlag = &RFlag
	expectedMessageObject.SmanI = &SmanI
	expectedMessageObject.PFDT = &PFDT
	expectedMessageObject.TSG = &TSG
	expectedMessageObject.Callsign = &Callsign
	expectedMessageObject.AISVersion = &AISVersion
	expectedMessageObject.MessageID = &MessageID
	expectedMessageObject.Repeati = &Repeati
	expectedMessageObject.Spare = &Spare
	expectedMessageObject.IMONumber = &IMONumber
	expectedMessageObject.EtimeStamp = &EtimeStamp
	expectedMessageObject.TimeStamp = &TimeStamp
	expectedMessageObject.UID = &UID
	expectedMessageObject.TrueHeading = &TrueHeading
	expectedMessageObject.COG = &COG
	expectedMessageObject.SOG = &SOG
	expectedMessageObject.TurnRate = &TurnRate
	expectedMessageObject.MPSD = &MPSD
	expectedMessageObject.GNSSAltitude = &GNSSAltitude

	actual := ParsedMessageObjectConverter(message)

	log.Println(*actual.HexState, expectedMessageObject.HexState)

	if reflect.DeepEqual(actual, expectedMessageObject) {
		t.Errorf("did not match")
	}

	var actualbytedump, _ = json.Marshal(actual)

	var expstring = "{\"Communication state in hex\":\"hex\",\"Dimension of ship reference for position\":{\"A\":8,\"B\":28,\"C\":4,\"D\":5},\"ETA [MMDDHHmm]\":10,\"Longitude\":24.5,\"Latitude\":65.3,\"Name\":\"name\",\"Destination\":\"valhalla\",\"Vendor ID in hex\":\"hexid\",\"Altitude sensor\":2,\"Assigned mode flag\":3,\"Class B band flag\":4,\"Class B display flag\":5,\"Class B DSC flag\":6,\"Class B Message 22 flag\":7,\"Class B unit flag\":8,\"Communication state selector\":9,\"DTE\":10,\"Navigational status\":11,\"Part number\":12,\"Position accuracy\":13,\"Position latency\":14,\"RAIM-flag\":15,\"Special manoeuvre indicator\":16,\"Type of electronic position fixing device\":17,\"Type of ship and cargo type\":18,\"Call sign\":\"sign\",\"AIS Version\":20,\"Message ID\":21,\"Repeat indicator\":22,\"Spare\":28,\"IMO number\":23,\"Ext_timestamp\":24,\"Time stamp\":25,\"User ID\":26,\"True heading\":13.2,\"COG\":13.3,\"SOG\":13.4,\"Rate of Turn ROTAIS\":-128,\"Maximum present static draught\":13.5,\"Altitude (GNSS)\":27}\""
	var actstring = string(actualbytedump)

	if expstring != actstring {
		t.Errorf("did not match")
		log.Println("expected:", expstring)
		log.Println("actual:", actstring)

	}

}
