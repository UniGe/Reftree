<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <div id="dashboardTabs" runat="server"></div>
<div id="indicatorsrow1" class="row">
</div>
<div class="clearfix"></div>
<div class="row">
	<div class="col-md-6" id="upcomingevents" style ="display:none;">
	</div>
    <div class="col-md-6" id="scheduledtasks" style ="display:none;">
	</div>
</div>
<div class="clearfix"></div>
    
<div id="graphSpot"></div>
    
<div class="clearfix"></div>

<script>

    $.getScript(window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/dashboard.js")
        .done(function () {

            $("#spanbig").text("Dashboard");
            //Date per i Grafici
            var usercanschedule = false;

            var userprofiles = window.UserAppProfiles.split(';');

            for (var i = 0; i < userprofiles.length-1; i++) {
                //se l' utente ha un profilo che puo' schedulare
                if (userprofiles[i].split('|')[2].toLowerCase() == "true") {
                    usercanschedule = true;
                    break;
                }
            }

            if (usercanschedule === true) {
                $("#upcomingevents").css("display", "block");
                $("#scheduledtasks").css("display", "block");
            }
            else {
                $("#scheduledtasks").removeClass("col-md-6");
                $("#scheduledtasks").addClass("col-md-12");
                $("#scheduledtasks").css("display", "block");
                $("#upcomingevents").remove();
            }


            var d = new Date();
            var start = new Date(d.getFullYear(), 0, 1);

            var dend = d;

            var dstart = start;
            var datastart = kendo.toString(dstart, "yyyyMMdd");

            var dataend = kendo.toString(dend, "yyyyMMdd");
            //definisco le date dell'intervallo per il calendario
            dstart = new Date();
            dstart.setFullYear(dstart.getFullYear() - 10);
            dend = new Date();
            dend.setDate(dend.getDate() + 30);



            Index.dateFrom = dstart;
            Index.dateTo = dend;
            //$.ajax({
            //    type: "GET",
            //    url: "/api/Magic_Cultures/GetSessionCulture",
            //    contentType: "application/json; charset=utf-8",
            //    dataType: "json",
            //    success: function (e) {
            //        culture = e;
                    createDashboardTemplates();
                    Index.init();
                    Index.initIndicators(datastart, dataend);
                    Index.initCalendarTasks(dstart, dend, false);
                    refreshallcharts(datastart, dataend);
                    
                    addRangePickers({
                        'statisticsRangePicker': { 'start': null, 'end': null, 'startDate': null, 'endDate': null, 'defaultStart': start, 'defaultEnd': dend, 'updateView': refreshGraphs },
                        'upcomingEventsRangePicker': { 'start': null, 'end': null, 'startDate': null, 'endDate': null, 'defaultStart': dstart, 'defaultEnd': dend, 'updateView': refreshEvents },
                        'eventsRangePicker': { 'start': null, 'end': null, 'startDate': null, 'endDate': null, 'defaultStart': dstart, 'defaultEnd': dend, 'updateView': refreshEvents }

                    });
                    
                    if (typeof taskLoad != 'undefined') {
                        taskLoad.resolve();
                    }
               // }
            //});
            //window.onresize= function () { refreshallcharts(datastart,dataend) };
          
        });
    </script>

</asp:Content>
