
// ********************
// 
// PROPERTY FORM
// 
// ********************

$("#btnSubmitProperty").prop("disabled", true)

    // Button is enabled upon next key press after all inputs have a value
    $("div#propertyDiv input").keyup(function() {
        console.log("key pressed");
        if ($("#streetAddress").val() != "" && $("#postalCode").val() != "" && $("#city").val() != "") {
            $("#btnSubmitProperty").prop("disabled", false);
        } else {
            $("#btnSubmitProperty").prop("disabled", true);
        }
    })

// ********************
// 
// LANDLORD FORM
// 
// ********************


// ENABLE AND DISABLE ADD BUTTON

    var allLandlordsList = {};
    var allLandlordsListKeys = [];

    // All buttons start off disabled
    $("#btnAddLandlord").prop("disabled", true);
    $("#btnSubmitLandlord").prop("disabled", true);
    $("#btnDeleteLandlord").prop("disabled", true);
    $("#lblLandlordDelInstructions").hide();

    // Button is enabled upon next key press after all inputs have a value
    $("div#landlordDiv input").keyup(function() {
        if ($("#landlordName").val() != "" && $("#landlordId").val() != "" && $("#landlordAddress").val() != "") {
            $("#btnAddLandlord").prop("disabled", false);
        } else {
            $("#btnAddLandlord").prop("disabled", true);
        }
    })

// ADD A LANDLORD

function addLandlord() {
    var landlordName = $("#landlordName").val();
    var landlordId = $("#landlordId").val();
    var landlordAddress = $("#landlordAddress").val();

    $("#landlordList").append('<div id="'+landlordId+'" class="ui segment container landlordRecord"><h3>'+landlordName+'</h3><table style="width: 100%;"><colgroup><col width="50%"><col width="50%"></colgroup><tbody><tr><td><h5>'+landlordId+'</h5></td><td><p>'+landlordAddress+'</p></td></tr></tbody></table></div>');

    allLandlordsList[landlordId] = {landlordName: landlordName, landlordId: landlordId, landlordAddress: landlordAddress};
    allLandlordsListKeys.push(landlordId);
    
    $("#landlordName").val("");
    $("#landlordId").val("");
    $("#landlordAddress").val("");

    $("#warningNoLandlord").hide();
    $("#btnAddLandlord").prop("disabled", true);
    $("#btnSubmitLandlord").prop("disabled", false);
    $("#btnDeleteLandlord").prop("disabled", false);

}

// DELETE A LANDLORD
function deleteLandlord(){
    $("#lblLandlordDelInstructions").show();
    $(".btnLandlordCancelDelete").show();
    $(".landlordRecord").toggleClass("deletableLandlordRecord");
    $("#btnDeleteLandlord").prop("disabled", true);

    $(".landlordRecord").on("click", function(){
        $(this).hide();
        var deleteRecordId = $(this).attr('id');
        delete allLandlordsList[deleteRecordId];
        
        for( var i = 0; i < allLandlordsListKeys.length; i++){ 
            if ( allLandlordsListKeys[i] == deleteRecordId) {
                allLandlordsListKeys.splice(i, 1); 
            }
        }
        offLandlordDeleteMode();  
        console.log(allLandlordsListKeys);
    })
}

function offLandlordDeleteMode () {
    $(".landlordRecord").toggleClass("deletableLandlordRecord");
    $(".landlordRecord").unbind();
    $("#lblLandlordDelInstructions").hide();
    $(".btnLandlordCancelDelete").hide();

    if (allLandlordsListKeys.length != 0) {
        $("#btnDeleteLandlord").prop("disabled", false);
    } else {
        $("#warningNoLandlord").show();
    }
}

// ********************
// 
// TENANT FORM
// 
// ********************



// ENABLE AND DISABLE ADD BUTTON FOR TENANT FORM

var allTenantsList = {};
var allTenantsListKeys = [];

// All buttons start off disabled
$("#btnAddTenant").prop("disabled", true);
$("#btnSubmitTenant").prop("disabled", true);
$("#btnDeleteTenant").prop("disabled", true);
$("#lblTenantDelInstructions").hide();

// Button is enabled upon next key press after all inputs have a value
$("div#tenantDiv input").keyup(function() {
    if ($("#tenantName").val() != "" && $("#tenantId").val() != "" && $("#tenantAddress").val() != "") {
        $("#btnAddTenant").prop("disabled", false);
    } else {
        $("#btnAddTenant").prop("disabled", true);
    }
})

// ADD A TENANT

function addTenant() {
var tenantName = $("#tenantName").val();
var tenantId = $("#tenantId").val();
var tenantAddress = $("#tenantAddress").val();

$("#tenantList").append('<div id="'+tenantId+'" class="ui segment container tenantRecord"><h3>'+tenantName+'</h3><table style="width: 100%;"><colgroup><col width="50%"><col width="50%"></colgroup><tbody><tr><td><h5>'+tenantId+'</h5></td><td><p>'+tenantAddress+'</p></td></tr></tbody></table></div>');

allTenantsList[tenantId] = {tenantName: tenantName, tenantId: tenantId, tenantAddress: tenantAddress};
allTenantsListKeys.push(tenantId);

$("#tenantName").val("");
$("#tenantId").val("");
$("#tenantAddress").val("");

$("#warningNoTenant").hide();
$("#btnAddTenant").prop("disabled", true);
$("#btnSubmitTenant").prop("disabled", false);
$("#btnDeleteTenant").prop("disabled", false);

}

// DELETE A TENANT
function deleteTenant(){
    $("#lblTenantDelInstructions").show();
    $(".btnTenantCancelDelete").show();
    $(".tenantRecord").toggleClass("deletableTenantRecord");
    $("#btnDeleteTenant").prop("disabled", true);

    $(".tenantRecord").on("click", function(){
        $(this).hide();
        var deleteTenantRecordId = $(this).attr('id');
        delete allTenantsList[deleteTenantRecordId];

        for( var i = 0; i < allTenantsListKeys.length; i++){ 
            if ( allTenantsListKeys[i] == deleteTenantRecordId) {
                allTenantsListKeys.splice(i, 1); 
            }
        }
        offTenantDeleteMode();  
        console.log(allTenantsListKeys);
    })
}

function offTenantDeleteMode () {
    $(".tenantRecord").toggleClass("deletableTenantRecord");
    $(".tenantRecord").unbind();
    $("#lblTenantDelInstructions").hide();
    $(".btnTenantCancelDelete").hide();

    if (allTenantsListKeys.length != 0) {
        $("#btnDeleteTenant").prop("disabled", false);
    } else {
        $("#warningNoTenant").show();
    }
}

// ********************
// 
// AGENCY TERMS FORM
// 
// ********************

// RENEWAL COMMISSION BEHAVIOUR
$("#renewalCommissionAmount").prop("disabled", true);
$("#renewalCommissionType").change(function() {
    if ($("#renewalCommissionType").val() != "none") {
        $("#renewalCommissionAmount").prop("disabled", false);
    } else {
        $("#renewalCommissionAmount").prop("disabled", true);
        $("#renewalCommissionAmount").val("");
    }
})

// ENABLE AND DISABLE ADD BUTTON FOR TENANT FORM

var allAddTermsList = [];

// All buttons start off disabled
$("#btnAddTerm").prop("disabled", true);
$("#btnDeleteAddTerm").prop("disabled", true);
$("#lblAddTermsDelInstructions").hide();

// ADD Button is enabled upon next key press after all inputs have a value
$("#addTerms").keyup(function() {
    if ($("#addTerms").val() != "") {
        $("#btnAddTerm").prop("disabled", false);
    } else {
        $("#btnAddTerm").prop("disabled", true);
    }
})

// ADD AN ADDITIONAL TERM

function addTerm() {
    
    var addTerm = $("#addTerms").val();

    $("#addTermsList").append('<div id="'+addTerm+'" class="ui segment container termRecord"><h4>' + addTerm + '</div>');
    
    allAddTermsList.push(addTerm);
    
    $("#addTerms").val("");

    $("#warningNoAddTerms").hide();
    $("#btnAddTerm").prop("disabled", true);
    $("#btnDeleteAddTerm").prop("disabled", false);
    
    }
    
    // DELETE AN ADDITIONAL TERM
    function deleteAddTerm(){
        
        // Turn on delete Mode
        $("#lblAddTermsDelInstructions").show();
        $(".btnAddTermCancelDelete").show();
        $(".termRecord").toggleClass("deletableAddTermRecord");
        $("#btnDeleteAddTerm").prop("disabled", true);
        $(".termRecord").on("click", function(){
            $(this).hide();
            var deleteAddTermRecordId = $(this).attr('id');
            
            for ( var i = 0; i < allAddTermsList.length; i++) { 
                if ( allAddTermsList[i] == deleteAddTermRecordId) {
                    allAddTermsList.splice(i, 1); 
                }
            }
            offAddTermDeleteMode();
            console.log(allAddTermsList);
        })
    }

    function offAddTermDeleteMode () {
        $(".termRecord").toggleClass("deletableAddTermRecord");
        $(".termRecord").unbind();
        $("#lblAddTermsDelInstructions").hide();
        $(".btnAddTermCancelDelete").hide();

        // Turn Off Delete Mode
        if (allAddTermsList.length != 0) {
            $("#btnDeleteAddTerm").prop("disabled", false);
        } else {
            $("#warningNoAddTerms").show();
        }
    }