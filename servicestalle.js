//Variabel som används som semafor för att flagga när aktuell position är klar
var positionOK = false;

//Variabel som används som semafor för att flagga när kartan är ritad första gången
var kartaKlar = false;

//Variabler för att spara aktuell position
var minLatitud = 0;
var minLongitud = 0;

//Variabel för att spara referens till den karta som ritas (behövs för Google Maps API)
var karta;

//Variabler för att spara Serviceställets position
var servicestalletsLatitud = 0;
var servicestalletsLongitud = 0;

//Variabel för att spara Serviceställets namn
var servicestalletsNamn = "Okänt serviceställe";



$(document).ready(function ()
{
    // Hjälpvariabel för hanteringen av storleksförändringar på fönstret
    var hejdaBurst = 0;

    // Känn av om storleken på applikationens fönster ändras
    // Kan ske t.ex. genom att mobilen vrids från vertikalt till horisontellt läge
    // Här kopplas "resize-händelsen" till den här funktionen
    $(window).resize(function ()
    {
        // Om hejdaBurst är 0
        if (hejdaBurst === 0)
        {
            // Sätt hejdaBurst till 1
            // Vänta 1/10 sek och anropa sedan funktionen doResize
            hejdaBurst = 1;
            setTimeout(doResize(), 100);
        };
    });
    
    function doResize()
    {
        var ih = window.innerHeight;
        
        // Ta reda på fönstrets bredd och höjd
        // (Dela med 1 för att säkerställa numeriska resultat)
        var h = window.innerHeight / 1;
        var w = window.innerWidth / 1;

        // Sätt kartans bredd till fönstrets bredd (minus 25 pixel för att ge plats åt vertikal scrollbar)
        // ... och höjden till 80% av fönstrets höjd
        // Genom att sätta höjden lite mindre så kan rubriker över och under kartan synas
        // ... så att användaren kan förstå att man kan scrolla
        // Test visar att rubriken radbryts vid bredden ca 450px (smalt) så i så fall sätts höjden till 60%

        if (w < 450)
        {
            h = h * 0.6;
        }
        else
        {
            h = h * 0.8;
        };

        w = w - 30;

        // Här används JQuery-funktionen css som ändrar "stylingen" på en tagg (ett element)
        // ...och när man i Javascript adderar en numerisk variabel till en sträng (text) så omvandlas den en sträng
        $("#karta").css("width", w + "px").css("height", h + "px");

        // Säg åt Google MAps API att rita om kartan så att den fyller ut den nya storleken
        // ...annars kanske bara en del av kartan visas eller så blir delar av det nya utrymmet tomt
        if (kartaKlar)
        {
            google.maps.event.trigger(karta, 'resize');
        };

        // Nollställ hejdaBurst igen (så att resize-händelser kan fångas igen
        hejdaBurst = 0;
    };



    function positioneringOK(position)
    {
        //Positionering har lyckats! Spara latitud och longitud i minPosition
        minLatitud = position.coords.latitude;
        minLongitud = position.coords.longitude;

        //Flagga att aktuell position är klar
        positionOK = true;

        //Enbart för test: Meddela latitud och longitud på skärmen
        // alert("Latitud: " + minLatitud + " Longitud: " + minLongitud);
    };

    function positioneringFel(fel)
    {
        if (fel.code === 1)
        { // felkod 1 betyder att användaren inte tillät programmet att ta reda på aktuell postion
            alert("Du måste tillåta applikationen att läsa din aktuella positon om den ska fungera!");
        }
        if (fel.code === 2)
        { // felkod 2 betyder att för tillfället var omöjligt att läsa den aktuella positionen 
            alert("det var för tillfället omöjligt att läsa din aktuella position. Försök igen senare.");
        }
        if (fel.code === 3)
        { // felkod 3 betyder att det tog för lång tid (timeout) att ta reda på aktuell position
            alert("Det tog för lång tid att läsa din position. Försök igen senare.");
        }
    };

    function minPosition()
    {
        //Kolla om webbläsaren kan läsa aktuell geografisk position
        if ("geolocation" in navigator)
        {
            // Ja, geolocation är tillgänglig
            // Anropa funktionen getCurrentPostion med parametrar  
            //   positioneringOK som hanterar om anropet går bra och
            //   positioneringFel som hanterar om det blev något fel
            navigator.geolocation.getCurrentPosition(positioneringOK, positioneringFel);
        }
        else
        {
            // Nej, geolocation ÄR INTE tillgänglig
            // Visa felmeddelande
            alert("Din webbläsare har inte förmåga att läsa din position.");
        };
    };

    // Sätt storleken på kartan så att den anpassas till fönstrets storlek - initiera en första gång
    doResize();

    //Ta reda på positionen genom att anropa minPosition()
    minPosition();

});

function googleMapsLaddat()
{
    if (positionOK)
    {
        // Här ska vi använda variabeln karta som deklareats i början av filen (global variabel)
        // för att lagra en referens till den karta som Google Maps API ritar

        // Variabel för inställningar som bestämmer hur kartan visas
        var kartOptioner = { zoom: 13, center: { lat: minLatitud, lng: minLongitud } };

        // Variabel som pekar ut det element på webbsidan som är platshållare för kartan
        var kartPlats = document.getElementById("karta");

        // Ladda kartan på sin plats med kartOptioner
        karta = new google.maps.Map(kartPlats, kartOptioner);

        // Flagga att kartan är klar att resizas
        kartaKlar = true;

        // Variabel för inställningar av markör  // Ange icon för markören till manniska.png (en liten gubbe)
        var here = { position: { lat: minLatitud, lng: minLongitud }, map: karta, title: 'Här är jag!', icon: 'manniska.png' };
        // Sätt en markör på min plats
        var marker = new google.maps.Marker(here);

        hamtaServicestalle();
    }
    else
    {
        // Anropa den här funktionen igen efter 500 millisekunder
        setTimeout(googleMapsLaddat, 500);
    };
};

function hamtaServicestalle()
{
    // Bygg ihop en URL till PostNords API med rätt parametrar och värden
    // Grund-URL
    var postnordURL =
    "https://api2.postnord.com/rest/businesslocation/v1/servicepoint/findNearestByCoordinates.json";

    // Lägg till API-nyckel
    postnordURL = postnordURL + "?apikey=cb660527bd04cf4b56648e776e670313";

    // Lägg till landskod
    postnordURL += "&countryCode=SE";

    // Lägg till latitud för aktuell position
    postnordURL += "&northing=" + minLatitud;

    // Lägg till longitud för aktuell position
    postnordURL += "&easting=" + minLongitud;

    // Lägg till att bara ett serviceställe ska hämtas
    postnordURL += "&numberOfServicePoints=1"

    // Lägg till att språket är svenska
    postnordURL += "&locale=se"

    // Använd JQuery funktionen ajax för att genomföra anropet av PostNords API
    // Om det går bra ska funktionen svarFranPostNord anropas
    // Om det blir något fel ska ett felmeddelande visas
    $.ajax({
        url: postnordURL,
        dataType: 'jsonp',
        success: svarFranPostNord,
    })
        .fail(function (jqXHR, textStatus, errorThrown)
        {
            alert("Något gick fel i kommunikationen med PostNords API. Vänligen försök igen senare!");
        });
};

function svarFranPostNord(svar)
{
    // Hämta serviceställets namn och koordinater från svaret
    servicestalletsNamn = svar.servicePointInformationResponse.servicePoints[0].name;
    servicestalletsLatitud = svar.servicePointInformationResponse.servicePoints[0].coordinate.northing;
    servicestalletsLongitud = svar.servicePointInformationResponse.servicePoints[0].coordinate.easting;

    //Endast för test - visa serviceställets namn och position
    //alert("Serviceställe: " + servicestalletsNamn +
    //    ". Latitud: " + servicestalletsLatitud + " Longitud: " + servicestalletsLongitud);

    // Anropa markeraServicestalle för att rita ut en markör på kartan där servicestället är
    markeraServicestalle();

    // Anropa ritaRutt för att visa rutten på kartan och visa vägbeskrivning
    ritaRutt();
};

//ritaRutt();

function markeraServicestalle()
{
    // Variabel för inställningar av markör
    var there = {
        position: { lat: servicestalletsLatitud, lng: servicestalletsLongitud },
        map: karta,
        icon: 'servicestalle.png', // Ange icon för markören till servicestalle.png (en PostNord-blå postlåda)
        title: servicestalletsNamn
    };
    // Sätt en markör på serviceställets plats
    var marker = new google.maps.Marker(there);
};

function ritaRutt()
{
    // Initiera Goggle Maps API tjänster för att beräkna och visa rutt
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;

    // Tala om för "ruttritaren" vilken karta den ska rita på
    directionsDisplay.setMap(karta);

    // Tala om var på webbsidan texten för vägbeskrivning ska placeras
    directionsDisplay.setPanel(document.getElementById('beskrivning'));

    // Tala om att "ruttritaren" inte ska sätta ut några markörer
    // (det är ju redan fixat!)
    directionsDisplay.setOptions({ suppressMarkers: true });

    // Anropa ruttberäknaren mes startpunkt (origin), slutpunkt (destination) och färdsätt (promenad)
    directionsService.route(
        {
            origin: { lat: minLatitud, lng: minLongitud },
            destination: { lat: servicestalletsLatitud, lng: servicestalletsLongitud },
            travelMode: google.maps.TravelMode.WALKING
        },
        function (response, status)
        {
            if (status === google.maps.DirectionsStatus.OK)
            {
                // Om ruttberäkningen gick bra - rita rutten och visa vägbeskrivningen!
                directionsDisplay.setDirections(response);
            }
            else
            {
                // Om det inte gick bra - Visa felmeddelande!
                alert("Det gick inte att bestämma färdväg. Försök senare!");
            }
        });
};