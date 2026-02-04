///Questi metodi vanno reimplementati in ogni solution
function prerenderdispatcher(grid, functionname, e, gridselector, result) {
  require([window.includesVersion + "/Custom/3/Scripts/config.js"], function() {
    require(["geo"], function() {});
  });

  //dispatcher personalizzato per cei
  prerenderdCei(grid);

  // LS cancello l'eventuale div contentente i parametri della griglia
  // aAltrimenti una volta impostati li vedo sempre anche se cambio griglia
  if ($("#DIV_SEL_PARAM").length) $("#DIV_SEL_PARAM").remove();

    switch (grid.gridcode) {
      case "SR_SUPEVA_TECNIC_EVALUEATION_REFERE":
          var originDataBound = grid.dataBound;
          grid.dataBound = function (e) {
              if (originDataBound) originDataBound.call(this, e);
              var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
                  .data("kendoGrid")
                  .dataSource.data();

              for (var i = 0; i < gridData.length; i++) {
                  console.log("passo");

                  var dataItem = gridData[i];

                  if (dataItem.SR_SUPEVA_LE_VALCHA_ID == 0 || dataItem.SR_SUPEVA_LE_VALCHA_ID == null) {
                      window.onbeforeunload = function (event) {
                          event.preventDefault();
                          event.returnValue = "Attenzione il rating incompleto, si desidera uscire?";
                          return event.returnValue;
                      };
                      $('div[gridname="' + e.sender.options.gridcode + '"]').closest(".modal-body").parent(".modal-content").find(".close").hide();
                      return
                  }
                  window.onbeforeunload = null;
                  $('div[gridname="' + e.sender.options.gridcode + '"]').closest(".modal-body").parent(".modal-content").find(".close").show();
              }
              return;
          };
          break;

    case "VI_CallReport":
      var ore_ = grid.dataSource.requestEnd;
     
      grid.dataSource.requestEnd = function(p) {
        $("a.k-grid-update:contains('Salva')").remove();
        ore_.call(this, p);
        if (p.type == "update") {
            console.log("passo");

            var refereID = p.sender.data()[0].LE_REFERE_ID;
            var product =p.sender.data()[0].PRODUCT_CODE;
            var deferred = $.Deferred();
            requireConfigAndMore(["MagicSDK"], function(MF) {
              doModal(true);
              MF.api
                .get({
                  storedProcedureName: "cerved.USP_CallReportCerved",
                  data: {
                    LE_REFERE_ID: refereID,
                    TIPDOC_CODE: product,
                    CF: null,
                  },
                })
                .then(
                  function(result) {
                    deferred.resolve(result);
                    console.log(result);
                  },
                  function(err) {
                    console.log(err);
                    deferred.reject();
                    doModal(false);
                  }
                );
            });

            $.when(deferred).then(function(MF) {
              if (MF.length > 0) {
                var obj = {
                  DO_DOCFIL_DO_DOCUME_ID: 0,
                  DO_DOCVER_LINK_FILE: "",
                };
                obj.DO_DOCFIL_DO_DOCUME_ID = MF[0][0].DO_DOCFIL_DO_DOCUME_ID;
                obj.DO_DOCVER_LINK_FILE = MF[0][0].DO_DOCVER_LINK_FILE;
                $.fileDownload("/api/Documentale/ViewFile/", {
                  data: obj,
                  httpMethod: "POST",
                });
                //refresch chiamante
                $('div[gridname="RM_VI_RIMACT_LIST"]')
                  .data("kendoGrid")
                  .dataSource.read();
                doModal(false);
              } else {
                kendoConsole.log("Errore nella produzione del file", "info");
                doModal(false);
              }
            });

        }
      };
      break;

case "VI_SignalMonitoring":
    let odb = grid.dataBound;
      grid.dataBound = function(e) {
        if (odb) odb.call(this, e);
        let gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();
          var tr;

        for (const dataItem of Object.values(gridData)) {

           if(dataItem.EV_STAGE_FL_START)
           $('div[gridname="' + e.sender.options.gridcode + '"]')
           .data("kendoGrid")
           .tbody.find("tr[data-uid=" + dataItem.uid + "]")
           .css("font-weight", "bold");

        }
      };
      break;

    case "TK_VI_CERVED_REFERE":
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "update") {
            console.log("passo");
          //refresh all dashboard elements
          setTimeout(function() {
            $(".tab-pane.row.initialized.active")
              .children()
              .find($(".fa-refresh"))
              .click();
            $('div[gridname="RM_VI_REQUEST_LIST"]')
              .data("kendoGrid")
              .dataSource.read();
            $('div[gridname="RM_VI_RIMACT_LIST"]')
              .data("kendoGrid")
              .dataSource.read();
          }, 500);
        }
      };

      break;

    case "AL_VI_IDECTR_L": {
      //MarcoC 9/5/23
      let odb = grid.dataBound;
      grid.dataBound = function(e) {
        if (odb) odb.call(this, e);
        let gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        for (const dataItem of Object.values(gridData)) {
          let stageSTART = dataItem.EV_STAGE_FL_START;
          if (!stageSTART) {
            let currentUid = dataItem.uid;
            let currentRow = $("tr[data-uid='" + currentUid + "']");
            let terminaInviaButton = $(currentRow).find(".k-grid-TerminaInvia");
            terminaInviaButton.hide();
          }
        }
      };
      break;
    }

    case "AL_VI_IDECAT_CTR_L": {
      //MarcoC 9/5/23
      let odb = grid.dataBound;
      grid.dataBound = function(e) {
        if (odb) odb.call(this, e);

        $(".autoResize").click();

        let gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        let stageInserito = gridData[0].EV_STAGE_CODE == "CTR_1"; //basta il prino record
        if (!stageInserito) {
          $(".k-grid-save-changes").hide();
          $(".assocman").hide();
          $(".k-grid-cancel-changes").hide();
          for (const dataItem of Object.values(gridData)) {
            let currentUid = dataItem.uid;
            let currentRow = $("tr[data-uid='" + currentUid + "']");
            let checkSeleziona = $(currentRow).find("input.Selezione:checkbox");
            checkSeleziona.prop("disabled", true);
          }
        }
      };
      break;
    }

    case "AL_VI_IDEANA_CTR_IDECTR": {
      //MarcoC 10/5/23
      let odb = grid.dataBound;
      grid.dataBound = function(e) {
        if (odb) odb.call(this, e);

        $(".autoResize").click();

        $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();
      };
      break;
    }

    case "RLI_VI_MIGRATE_DATI_GEN":
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "read") {
          //refresh all dashboard elements
          $(".fa-refresh").click();
        }
      };
      break;

    case "F24_TEMPLATE_MAIL":
      var origedit = grid.edit;
      grid.edit = function(e) {
        //elimina il pulsante salva gli ENTI cei
        origedit.call(this, e);
        $(".k-grid-update").text("Invia email");
        if (e.model.RTCONL_F24_FILE_NAME == null)
          $(".k-grid-update")
            .kendoButton({
              enable: false,
            })
            .data("kendoButton");
      };
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "update") {
          //refresh all dashboard elements
          setTimeout(function() {
            $(".tab-pane.row.initialized.active")
              .children()
              .find($(".fa-refresh"))
              .click();
            $('div[gridname="F24_REGFIS_ANNUAL_CONS_POSTE"]')
              .data("kendoGrid")
              .dataSource.read();
            if ($('div[gridname="F24_SENDED"]').length)
              $('div[gridname="F24_SENDED"]')
                .data("kendoGrid")
                .dataSource.read();
          }, 1500);
        }
      };
      break;
    case "F24_RETTIFICA_DATI":
      includejs(
        "/Custom/" + window.ApplicationCustomFolder + "/Scripts/refereAction.js"
      );
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "update") {
          //refresh all dashboard elements
          setTimeout(function() {
            $(".tab-pane.row.initialized.active")
              .children()
              .find($(".fa-refresh"))
              .click();
            $('div[gridname="LE_VI_F24_REGFIS_ANNUAL_L_POSTE_ALL"]')
              .data("kendoGrid")
              .dataSource.read();
            if ($('div[gridname="LE_VI_RLI_REGFIS_F24_READY_RACC"]').length)
              $('div[gridname="LE_VI_RLI_REGFIS_F24_READY_RACC"]')
                .data("kendoGrid")
                .dataSource.read();
            if ($('div[gridname="F24_REGFIS_ANNUAL_CONS_POSTE"]').length)
              $('div[gridname="F24_REGFIS_ANNUAL_CONS_POSTE"]')
                .data("kendoGrid")
                .dataSource.read();
            if($('div[gridname="F24_RETTIFICA_DATI"]')
            .data("kendoGrid")
            .dataSource.data()[0].LE_RTCONL_FLAG_SOLLECITATO && $('div[gridname="F24_SENDED"]').length )
            $('div[gridname="F24_SENDED"]')
            .data("kendoGrid")
            .dataSource.read();
          }, 1000);
        }
      };
      break;
    case "F24_REGFIS_ANNUAL_CONS_POSTE":
    case 'LE_VI_RLI_REGFIS_F24_READY_RACC':

      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
      
          //refresh all dashboard elements
          setTimeout(function() {
            $(".tab-pane.row.initialized.active")
              .children()
              .find($(".fa-refresh"))
              .click();
            if($('div[gridname="F24_SENDED"]').length )
            $('div[gridname="F24_SENDED"]')
              .data("kendoGrid")
              .dataSource.read();

          }, 500);
        
      };
      break;
    case "TKR_VI_REQUES_BUDGET_WIZARD_L":
      var originDataBound = grid.dataBound;

      grid.dataBound = function(e) {
        let self = this;
        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();
        if (!gridData.length) {
          let dataItem = e.sender.magicFormScope.model;
          var kGrid = e.sender;
          let extendedObj = {};
          //if the grid is inside a wizard, the model of the wizard is also sent to the SP
          if (kGrid && getWizardScope(kGrid.magicFormScope)) {
            var wholeModel = getWizardScope(kGrid.magicFormScope).models;
            extendedObj = $.extend(extendedObj, dataItem, wholeModel);
          }

          let hasKeys = Object.keys(extendedObj).length;

          manageStageInCellConstraints(
            hasKeys ? extendedObj : dataItem,
            "TKR_VI_REQUES_BUDGET_WIZARD_L",
            grid.entityName,
            "TK_REQUES_TK_REQREQ_ID",
            "itemchange"
          ).then(function() {
            originDataBound.call(self, e);
          });
        } else {
          originDataBound.call(self, e);
        }
      };
      break;

    case "SR_VI_MESSAGE_LIST":
      var originDataBound = grid.dataBound;

      var origedit = grid.edit;

      grid.edit = function(e) {
        origedit.call(this, e);

        if (e.model.FLAG_TO_READ && e.model.SR_SUPMES_FLAG_IN) {
          var storedprocedurename = "core.SR_USP_MESSAGE_READ";
          var a = buildXMLStoredProcedureReturnDataSet(
            e.model,
            storedprocedurename,
            null
          );

          a.then(function(e) {
            $('[title="Reload"]')[1].click();
          });
        }

        return;
      };

      grid.dataBound = function(e) {
        // var currentData = $('div[gridname="SR_VI_MESSAGE_LIST"]')
        // .data('kendoGrid')
        // .dataSource.data();

        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        var row = e.sender.items();

        for (var i = 0; i < gridData.length; i++) {
          console.log("passo");

          var dataItem = gridData[i];

          if (
            dataItem.SR_SUPMES_DATE_READ == null &&
            dataItem.SR_SUPMES_FLAG_IN
          ) {
            $('div[gridname="' + e.sender.options.gridcode + '"]')
              .data("kendoGrid")
              .tbody.find("tr[data-uid=" + dataItem.uid + "]")
              .css("font-weight", "bold");
          }

          var currentUid = gridData[i].uid;
          var currentRow = $("tr[data-uid='" + currentUid + "']");
        }

        // $.each(currentData, function(i, p) {
        //   console.log(p)
        //   var dataRead = dataItems[i].get("SR_SUPMES_DATE_READ");

        //   var row = e.sender.tbody.find("[data-uid='" + dataItems[i].uid + "']");
        //   if (dataRead) {
        //     row.addClass("discontinued");
        //   }

        // });
        return;
      };

      break;
    case "MONITOR_RLI":
    case "MONITOR_RLI_PRIMA":
      var originDataBound = grid.dataBound;
      const today = new Date();
      const currentYear = today.getFullYear();
      const lastDayOfYear = new Date(currentYear, 11, 31); // 31 dicembre

      const giorno = String(lastDayOfYear.getDate()).padStart(2, '0');
      const mese = String(lastDayOfYear.getMonth() + 1).padStart(2, '0'); // +1 perché i mesi sono indicizzati da 0
      const anno = lastDayOfYear.getFullYear();

      const formattedDate = `${giorno}/${mese}/${anno}`;
 

      grid.dataBound = function(e) {
        if (originDataBound) originDataBound.call(this, e);
        // da vedere con Dario se inserire una configurazione a livello di tab
        // per ora disabilito il from e lo impost sempre al 1900
        $(".start.k-input").val("01/01/1900");
        $(".end.k-input").val(formattedDate);
      };

      break;

    case "EURSPA_CORPORATE_COMP":
      $(
        '<div id="RolMes" style="color:black;">Obbligatorio inserire un legale rappresentante che sia anche sottoscrittore dichiarazione ex art 80 e tutti i soggetti muniti di potere</div>'
      ).insertAfter($('label:contains("Ruoli *"):last'));
      break;
    case "EUR_SR_CERREF":
      var refereID = grid.__apiCallData.data.SR_SUPREG_10.LE_REFERE_ID;
      var storedprocedurename = "core.SR_USP_GetAlertCert";
      var data = {};
      data.refereID = refereID;
      data.SR_SUPREG_ID = grid.__apiCallData.data.ID;
      if ($("#certErr").length) $("#certErr").remove();

      var a = buildXMLStoredProcedureReturnDataSet(
        data,
        storedprocedurename,
        null
      );
      var str = "";
      a.then(function(e) {
        $.each(e[0], function(i, val) {
          if (i == e[0].length - 1) str += val.DO_TIPDOC_DESCRIPTION;
          else str += val.DO_TIPDOC_DESCRIPTION + "<br>";
        });

        if (str.length > 0) {
          $(
            '<div id="certErr" style="color:red;">' + str + "</div>"
          ).insertAfter($('label:contains("Certificazioni"):last'));
          $('label:contains("Certificazioni")').html(
            "Certificazioni necessarie da inserire: *"
          );
        } else {
          if ($("#certErr").length) $("#certErr").remove();
          $('label:contains("Certificazioni")').html(
            "Certificazioni obbligatorie inserite o non necessarie"
          );
          return;
        }

        $("#certErr").html(str);
      });

      var save___ = grid.save;
      grid.save = function(e) {
        var input = {};
        input.refereID = e.model.SR_REFERE_ID;
        input.SR_SUPREG_ID = grid.__apiCallData.data.ID;
        var str = "";

        var mandDoc = buildXMLStoredProcedureReturnDataSet(
          input,
          "core.SR_USP_GetAlertCert",
          null
        );

        mandDoc.then(function(e) {
          if (e.length) {
            var currentData = $('div[gridname="EUR_SR_CERREF"]')
              .data("kendoGrid")
              .dataSource.data();
            var myArr = [];
            //nb il campo SR_CERREF_SR_CERTYP_ID passa in realta il do_tipdoc_id
            $.each(currentData, function(i, p) {
              myArr.push(p.SR_CERREF_SR_CERTYP_ID.toString());
            });
            //filtro l'array
            var filteredArray = e[0].filter(function(itm) {
              return myArr.indexOf(itm.DO_TIPDOC_ID.toString()) == -1;
            });

            $.each(filteredArray, function(i, val) {
              if (i == e[0].length - 1) str += val.DO_TIPDOC_DESCRIPTION;
              else str += val.DO_TIPDOC_DESCRIPTION + "<br>";
            });

            if ($("#certErr").length) $("#certErr").remove();

            if (str.length > 0) {
              if ($('label:contains("Certificazioni necessarie *")').length) {
                $(
                  '<div id="certErr" style="color:red;">' + str + "</div>"
                ).insertAfter(
                  $('label:contains("Certificazioni necessarie *"):last')
                );
                // $('label:contains("Certificazioni")').html(
                //   'Certificazioni obbligatorie da inserire: *'
                // );
              } else {
                $(
                  '<div id="certErr" style="color:red;">' + str + "</div>"
                ).insertAfter(
                  $(
                    'label:contains("Certificazioni necessarie da inserire: *"):last'
                  )
                );
              }
            } else
              $(
                'label:contains("Certificazioni obbligatorie da inserire: *")'
              ).html("Certificazioni obbligatorie inserite o non necessarie");
          } else {
            if ($("#certErr").length) $("#certErr").remove();
            $('label:contains("Certificazioni")').html(
              "Certificazioni obbligatorie inserite o non necessarie"
            );
          }
        });

        if (save___) save___.call(this, e);
      };
      break;
    case "SR_DOCUME_UPLOADED":
      setTimeout(function() {
        console.log("Timeout");
        //var refereID = grid.__apiCallData.data.SR_SUPREG_10.LE_REFERE_ID;
        var wizardData = $('div[gridname="SR_DOCUME_UPLOADED"]')
          .data("kendoGrid")
          .options.getApiCallData().data;
        var refereID = wizardData.SR_SUPREG_10.LE_REFERE_ID;

        var storedprocedurename = "core.SR_USP_GetAlertDoc";
        var data = {};
        data.refereID = refereID;
        data.SR_SUPREG_ID = wizardData.ID;
        data.wizardData=wizardData.SR_SUPREG_01;
        if ($("#docErr").length) $("#docErr").remove();

        var a = buildXMLStoredProcedureReturnDataSet(
          data,
          storedprocedurename,
          null
        );
        var str = "";
        a.then(function(e) {
          $.each(e[0], function(i, val) {
            if (i == e[0].length - 1) str += val.DO_TIPDOC_DESCRIPTION;
            else str += val.DO_TIPDOC_DESCRIPTION + "<br>";
          });

          // var certData = $('div[gridname="EUR_SR_CERREF"]')
          //   .data('kendoGrid')
          //   .dataSource.data();

          // console.log(certData);

          if (str.length > 0) {
            if ($('label:contains("Documenti necessari *")').length) {
              $(
                '<div id="docErr" style="color:red;">' + str + "</div>"
              ).insertAfter($('label:contains("Documenti necessari *"):last'));
            } else if (
              $('label:contains("Documenti necessari inseriti *")').length
            ) {
              $(
                '<div id="docErr" style="color:red;">' + str + "</div>"
              ).insertAfter(
                $('label:contains("Documenti necessari inseriti *"):last')
              );
              $('label:contains("Documenti necessari inseriti *")').html(
                "Documenti obbligatori da inserire: *"
              );
            } else {
              $(
                '<div id="docErr" style="color:red;">' + str + "</div>"
              ).insertAfter(
                $('label:contains("Documenti obbligatori da inserire: *"):last')
              );
            }

            // $(
            //   '<div id="docErr" style="color:red;">' + str + '</div>'
            // ).insertAfter($('label:contains("Documenti necessari *"):last'));
            // $('label:contains("Documenti necessari *")').html(
            //   'Documenti obbligatori da inserire: *'
            // );
          } else $('label:contains("Documenti necessari *")').html("Documenti necessari inseriti *");

          $("#docErr").html(str);
        });

        var save___ = grid.save;
        grid.save = function(e) {
          var input = {};
          input.refereID = e.model.SR_REFERE_ID;
          input.SR_SUPREG_ID = wizardData.ID;
          var str = "";

          var mandDoc = buildXMLStoredProcedureReturnDataSet(
            input,
            "core.SR_USP_GetAlertDoc",
            null
          );

          mandDoc.then(function(e) {
            if (e.length) {
              var currentData = $('div[gridname="SR_DOCUME_UPLOADED"]')
                .data("kendoGrid")
                .dataSource.data();

              if ($('div[gridname="EUR_SR_CERREF"]').length) {
                var certData = $('div[gridname="EUR_SR_CERREF"]')
                  .data("kendoGrid")
                  .dataSource.data();

                $.each(certData, function(i, p) {
                  myArr.push(p.SR_CERREF_SR_CERTYP_ID.toString());
                });
              }

              var myArr = [];
              $.each(currentData, function(i, p) {
                myArr.push(p.DO_DOCUME_DO_TIPDOC_ID.toString());
              });

              //filtro l'array
              var filteredArray = e[0].filter(function(itm) {
                return myArr.indexOf(itm.DO_TIPDOC_ID.toString()) == -1;
              });

              $.each(filteredArray, function(i, val) {
                if (i == e[0].length - 1) str += val.DO_TIPDOC_DESCRIPTION;
                else str += val.DO_TIPDOC_DESCRIPTION + "<br>";
              });

              if ($("#docErr").length) $("#docErr").remove();

              if (str.length > 0) {
                if ($('label:contains("Documenti necessari *")').length) {
                  $(
                    '<div id="docErr" style="color:red;">' + str + "</div>"
                  ).insertAfter(
                    $('label:contains("Documenti necessari *"):last')
                  );
                  $('label:contains("Documenti necessari *")').html(
                    "Documenti obbligatori da inserire: *"
                  );
                } else if (
                  $('label:contains("Documenti necessari inseriti *")').length
                ) {
                  $(
                    '<div id="docErr" style="color:red;">' + str + "</div>"
                  ).insertAfter(
                    $('label:contains("Documenti necessari inseriti *"):last')
                  );
                  $('label:contains("Documenti necessari inseriti *")').html(
                    "Documenti obbligatori da inserire: *"
                  );
                }
              } else
                $(
                  'label:contains("Documenti obbligatori da inserire: *")'
                ).html("Documenti necessari inseriti *");
            }
          });

          if (save___) save___.call(this, e);
        };
      }, 5);
      break;
    case "CEI_MIG_SCHEDA_A":
      // includejs('/Custom/' + window.ApplicationCustomFolder + '/Scripts/viewCard.js');
      var originDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originDataBound) originDataBound.call(this, e);

        $(".k-grid-viewCard")
          .addClass("icon-info")
          .addClass("fa-2x")
          .removeClass("k-button");
        $(".k-grid-viewCard").attr("title", "Vedi scheda su Cei Immobili");
        $(".k-grid-viewCard").empty();
        $(".k-grid-viewCard")
          .parent()
          .attr("align", "center");
      };
      break;

    case "AS_ASSET_CEI":
      //add custom help on line
      if (!$("#_helpOnLine").length) {
        var htmlHelp =
          '<button id="_helpOnLine" style=" display: inline-block; float: right; cursor: pointer;" class="btn btn-white btn-icon btn-cerchio" onclick="helpDownloadFile(event,&apos;add_asset&apos;)" data-toggle="tooltip" data-placement="bottom" title="Consulta i casi d&rsquo;uso"> <i class="fa fa-question fa-2x"></i></button>';
        $(htmlHelp)
          .appendTo($(".page-title"))
          .css({
            width: "40px",
            height: "40px",
            "border-radius": "40px",
            "text-align": "center",
            "padding-top": "inherit",
          });
      }
      var origedit = grid.edit;
      grid.edit = function(e) {
        //elimina il pulsante salva per gli immobili di culto
        origedit.call(this, e);
        if (e.model.AS_TIPSAS_FLAG_CENSIMENTO_CHIESE)
          $(".k-grid-update").remove();
      };
      break;
    case "STRU_AS_ASSET_CHILD":
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) del chiamante alla chiusura della popup
        origedit.call(this, e);
        e.container
          .parent()
          .find(".k-window-titlebar.k-header")
          .find("a[role=button]")
          .bind("click", function(evt) {
            e.sender.refresh();
            //eseguo anche il refresh dei dati x evitare di mantenere il record null in grid
            $('div[gridname="' + e.sender.options.gridcode + '"]')
              .data("kendoGrid")
              .dataSource.read();
          });
      };

      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var row = e.sender.items();
        row.find(".k-hierarchy-cell").html("");
      };

      break;
    /* case 'SR_VI_ServiceList':
                grid.pageable = true;
                grid.page = function (e) {
                    var btn = e.sender.element.find('.k-grid-save-changes');
                    btn.trigger("click");
                }
               break; */

    case "AS_US_VI_ASSET_UPDATE":
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) del chiamante alla chiusura della popup
        origedit.call(this, e);
        e.container
          .parent()
          .find(".k-window-titlebar.k-header")
          .find("a[role=button]")
          .bind("click", function(evt) {
            e.sender.refresh();
            $('div[gridname="' + e.sender.options.gridcode + '"]')
              .data("kendoGrid")
              .dataSource.read();
          });
      };

      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        if (gridData[0].AS_TIPASS_CODE == "AGG")
          for (var i = 0; i < gridData.length; i++) {
            console.log("passo");
            var currentUid = gridData[i].uid;
            var currentRow = $("tr[data-uid='" + currentUid + "']");
            var validaButton = $(currentRow).find(".k-grid-exploreAsset");
            validaButton.hide();
          }
      };

      break;
    case "GARE_INVIT_LIST":
    case "GARE_INVIT_LIST_INV":
      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        for (var i = 0; i < gridData.length; i++) {
          var currentUid = gridData[i].uid;
          var currentRow = $("tr[data-uid='" + currentUid + "']");
          var sendButton = $(currentRow).find(".sedOffer");
          var partecipa = $(currentRow).find(".part1");
          var viewData = $(currentRow).find(".VIS1");
          var interesse = $(currentRow).find(".manInte");

          //move button
          interesse.insertAfter(sendButton);
          //hide "invia oferta" button
          if (
            (gridData[i].LogField || gridData[i].TK_TENREF_PROT_DATE) &&
            (gridData[i].OFF_STAGE == null ||
              gridData[i].OFF_STAGE != "OF_INTE")
          ) {
            sendButton.hide();
          }

          if (gridData[i].EV_STAGE_CODE != "DEF") {
            partecipa.hide();
            viewData.hide();
          } else {
            interesse.hide();
          }
        }
        //hide last col
        e.sender.hideColumn(e.sender.columns.length - 1);
      };
      break;
    case "DO_VI_MISSED_DOCUMENTS":
      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        for (var i = 0; i < gridData.length; i++) {
          var currentUid = gridData[i].uid;
          var currentRow = $("tr[data-uid='" + currentUid + "']");
          if(currentRow && !gridData[i].PRESENTE)
          currentRow.css({ color: "red" });

        };
      }
      break; 
    case "TK_TENREF_SELECTION":
      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        for (var i = 0; i < gridData.length; i++) {
          var currentUid = gridData[i].uid;
          // var currentRow = grid.table.find("tr[data-uid='" + currentUid + "']");
          var currentRow = $("tr[data-uid='" + currentUid + "']");
          var interest = $(currentRow).find(".interset1");

          if (gridData[i].Checked == 0 || gridData[i].FLAG_INTEREST == false)
            interest.hide();
          else if (
            gridData[i].Checked == 1 &&
            gridData[i].TK_TENREF_DATE_REQ_EXPRESSION_INTEREST &&
            gridData[i].FLAG_INTEREST == false
          )
            interest.hide();
        }
      };

      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "read") {
          //get sender rec and check stage
          var myPK = p.sender._filter.filters[0].value;
          // var senderRec = $('#'+grid.gridcode+'').data("kendoGrid").dataSource.get(myPK);
          var senderGrid = $("#" + grid.gridcode + "").parents("div[gridname]");

          var senderRec = senderGrid.data("kendoGrid").dataSource.get(myPK);

          if (
            senderGrid.data("kendoGrid").options &&
            senderGrid.data("kendoGrid").options.code == "TK_VI_COMEVA_LIST"
          )
            removeGridButton(grid.gridcode);
          //if stage != PROCAFF remove all toolbar button x the grid
          else if (senderRec.EV_STAGE_CODE != "PROCAFF")
            removeGridButton(grid.gridcode);
        }
      };
      break;
    case "SR_CURRENT_SUPPLIER_REGISTRATION":
    case "SORGENTE_ALBO":
    case "SIDIEF_ALBO":
    case "EUR_ALBO":
    case "ANTIRION_ALBO":
    case "INVESTIRE_ALBO":
      if (!$("#_helpOnLine").length) {
        var htmlHelp =
          '<button id="_helpOnLine" style=" display: inline-block; float: right; cursor: pointer;" class="btn btn-white btn-icon btn-cerchio" onclick="helpDownloadFile(event,&apos;sr_albo&apos;)" data-toggle="tooltip" data-placement="bottom" title="Manuale d&rsquo;uso"> <i class="fa fa-question fa-2x"></i></button>';
        $(htmlHelp)
          .appendTo($(".page-title"))
          .css({
            width: "40px",
            height: "40px",
            "border-radius": "40px",
            "text-align": "center",
            "padding-top": "inherit",
          });
      }
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) del chiamante alla chiusura della popup
        origedit.call(this, e);
        e.container
          .parent()
          .find(".k-window-titlebar.k-header")
          .find("a[role=button]")
          .bind("click", function(evt) {
            e.sender.refresh();
          });
      };

      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
          .data("kendoGrid")
          .dataSource.data();

        for (var i = 0; i < gridData.length; i++) {
          var currentUid = gridData[i].uid;
          // var currentRow = grid.table.find("tr[data-uid='" + currentUid + "']");
          var currentRow = $("tr[data-uid='" + currentUid + "']");
          var validaButton = $(currentRow).find(".ValidButton");
          var modifyButton = $(currentRow).find(".k-grid-ModifyData");

          if (validaButton.length) {
            modifyButton.insertAfter(validaButton);
            //hide the buttons programmatically
            switch (gridData[i].SR_REGSTA_CODE) {
              case "REG_TOCOMPILE":
                {
                  modifyButton.hide();
                  if (gridData[i].LogField && gridData[i].LogField.length > 0)
                    validaButton.hide();
                }
                    break;
                case "REG_OUT":
                {
                        validaButton.hide();
                        modifyButton.hide();
                        break;
                }
              case "REG_EXPIRE":
                validaButton.hide();
                modifyButton.hide();
                break;
              case "REG_SUSP":
                {
                  modifyButton.hide();
                  if (gridData[i].LogField && gridData[i].LogField.length > 0)
                    validaButton.hide();
                }
                break;
              case "REG_TOVALID":
                {
                  modifyButton.hide();
                  if (
                    (gridData[i].LogField && gridData[i].LogField.length > 0) ||
                    gridData[i].SR_SUPREG_VALID_REQUEST_DATE
                  )
                    validaButton.hide();
                }
                break;
              case "REG_ACTIVE":
                              {
                                var today = new Date();
                                var toDate = gridData[i].SR_SUPREG_END_VALID_DATE;
                                if (Math.round((toDate - today) / (1000 * 60 * 60 * 24)) <= gridData[i].GG_PREAVVISO)
                                {
                                    modifyButton.hide();
                                    validaButton.hide();
                                }
                              } 
                break;
            }
          } else {
            validaButton = $(currentRow).find(".svicomValida");
            switch (gridData[i].SR_REGSTA_CODE) {
              case "REG_EXPIRE":
                validaButton.hide();
                modifyButton.hide();
                break;
              case "REG_ACTIVE":
                modifyButton.insertAfter(validaButton);
                validaButton.hide();
                break;
              case "REG_SUSP":
                {
                  modifyButton.hide();
                  if (gridData[i].LogField && gridData[i].LogField.length > 0)
                    validaButton.hide();
                }
                break;
              case "REG_TOVALID":
                if (e.sender._data[i].SR_SUPREG_VALID_REQUEST_DATE)
                  validaButton.hide();
                break;
              case "REG_TOCOMPILE":
                {
                  modifyButton.hide();
                  if (gridData[i].LogField && gridData[i].LogField.length > 0)
                    validaButton.hide();
                }
                break;
            }
          }
          //move the modify button in the same column ..
        }
        //hide the last column (button)
        if (modifyButton && modifyButton.length)
          e.sender.hideColumn(e.sender.columns.length - 1);
      };
      break;
    //in new se presente un filtro in cascade alla search grid sulla colonna LE_CLAREF_CODE
    //setta il model del medesimo campo con il valore del filtro in cascade per consentire alla proc di inserimento
    case "REFERE_CLAREF_AUTO":
      var origedit = grid.edit;
      grid.edit = function(e) {
        origedit.call(this, e);
        if (e.model.id === 0) {
          var filt = e.sender.dataSource.filter();
          var filteredArray = filt.filters.filter(function(itm) {
            return itm.type == "cascadeSearch" && itm.field == "LE_CLAREF_CODE";
          });
          if (filteredArray) {
            e.model.set("LE_CLAREF_CODE", filteredArray[0].value);
          }
        }
      };
      break;
    case "SR_VI_QUESTIONNAIRE_ESG":
      var origedit = grid.edit;
      grid.edit = function(e) {
        origedit.call(this, e);
        //all input and textarea selector
        $("[id^=ESG]").css("height", "60px");
        //   $("textarea[id^=ESG]").css("height", "60px");
        $("[id^=filler]").css("display", "none");
        setTimeout(function() {
          $(".panel-title_r3")
            .find("a")
            .append(
              "<i style='margin:5px;' class='fa fa-angle-down fa-lg pull-right' aria-hidden='true'></i>"
            );
        }, 1000);
      };
      break;
    case "SR_DOCUME_MISSING":
      var savechanges___ = grid.saveChanges;
      grid.saveChanges = function(e) {
        var currentData = e.sender.dataSource.data().filter(function(e) {
          return e.DO_DOCVER_LINK_FILE != null;
        });
        for (var i = 0; i < currentData.length; i++) {
          var file = JSON.parse(currentData[i].toJSON().DO_DOCVER_LINK_FILE);
          var format = currentData[i].DO_TIPDOC_EXTENSIONS.toLowerCase();

          if (format) {
            for (var x = 0; x < file.length; x++) {
              if (
                file[x].ext &&
                file[x].name
                  .split(".")
                  .pop()
                  .toLowerCase() != format.split(".").pop()
              )
                kendoConsole.log(
                  getObjectText(
                    "estensione errata per il file :" +
                      currentData[i].do_tipdoc_description
                  ),
                  true
                );
            }
          }

          // var files = currentData[i].toJSON().DO_DOCVER_LINK_FILE.match(/^\[{/) ? JSON.parse(currentData[i].toJSON().DO_DOCVER_LINK_FILE) : [{ name: currentData[i].toJSON().DO_DOCVER_LINK_FILE }],
          // output = '';
        }

        if (savechanges___) savechanges___.call(this, e);
      };
      break;
    case "SR_COMPANY_SHAREHOLDERS":
      var save___ = grid.save;
      grid.save = function(e) {
        var currentData = e.sender.dataSource.data();
        var SumPerc = 0;

        for (var i = 0; i < currentData.length; i++) {
          SumPerc += currentData[i].toJSON().SR_REFERE_EQUITY_SHARES;
        }
        if (SumPerc > 100) {
          kendoConsole.log(getObjectText("perc100"), true);
          e.preventDefault();
        }

        if (save___) save___.call(this, e);
      };
      break;

    case "AS_VI_ASSUTI_LIST":
      var savechanges___ = grid.saveChanges;
      grid.saveChanges = function(e) {
        var currentData = e.sender.dataSource.data();
        var SumPerc = 0;
        var today = new Date();

        for (var i = 0; i < currentData.length; i++) {
          var from = currentData[i].toJSON().AS_ASSUTI_DATE_START;
          if (!from) {
            kendoConsole.log(getObjectText("dtFrom"), true);
            e.preventDefault();
          } else if (currentData[i].toJSON().AS_ASSUTI_DATE_END) {
            var to = currentData[i].toJSON().AS_ASSUTI_DATE_END;
            to.setHours(23, 59);
            if (dateCheck(from, to, today))
              SumPerc += currentData[i].toJSON().AS_ASSUTI_PERC_USE;
          } else {
            SumPerc += currentData[i].toJSON().AS_ASSUTI_PERC_USE;
          }
        }
        if (SumPerc != 100) {
          kendoConsole.log(getObjectText("perc100"), true);
          e.preventDefault();
        }

        if (savechanges___) savechanges___.call(this, e);
      };
      break;
    case "CK_VI_CONTRA_L":
      includejs(
        "/Custom/" + window.ApplicationCustomFolder + "/Scripts/itergara.js"
      );
      break;
    case "TD_VI_LE_REFERE_L":
    case "LE_VI_REFERE_ALL":
    case "LE_VI_REFERE_SEARCH_ALL":
    case "LE_VI_REFERE_SUPPLIER_CEI":
    case "TKB_VI_REFERE_FORN_UPD":
      includejs(
        "/Custom/" + window.ApplicationCustomFolder + "/Scripts/refereAction.js"
      );
      includejs(
        "/Custom/" + window.ApplicationCustomFolder + "/Scripts/itergara.js"
      );
      var origedit = grid.edit;
      grid.edit = function(e) {
        //elimina il pulsante salva gli ENTI cei
        origedit.call(this, e);
        if (e.model.LE_SPEREF_CODE == "ENT") $(".k-grid-update").remove();
      };

      break;
    // case "TK_TENDOC_tender_document":
    //case "TK_TENDOC_tender_document1":
    //  case "TK_TENDOF_document_offer":
    // case "TK_VI_TenderDetail":
    //   var functionGUID = getCurrentFunctionGUIDFromMenu();
    //   if (functionGUID == "c190ba25-2886-4097-908b-0f47e178c75e") break;

    //   var ore_ = grid.dataSource.requestEnd;
    //   grid.dataSource.requestEnd = function(p) {
    //     ore_.call(this, p);
    //     if (p.type == "read") {
    //       //get sender rec and check stage
    //       var myPK = p.sender._filter.filters[0].value;
    //       // var senderRec = $('#'+grid.gridcode+'').data("kendoGrid").dataSource.get(myPK);
    //       var senderGrid = $("#" + grid.gridcode + "").parents("div[gridname]");

    //       var senderRec = senderGrid.data("kendoGrid").dataSource.get(myPK);

    //       if (
    //         senderGrid.data("kendoGrid").options &&
    //         senderGrid.data("kendoGrid").options.code == "TK_VI_COMEVA_LIST"
    //       )
    //         removeGridButton(grid.gridcode);
    //       //if stage != DET remove all toolbar button x the grid
    //       else if (senderRec.EV_STAGE_CODE != "DET")
    //         removeGridButton(grid.gridcode);
    //     }
    //   };
    //   break;
    case "TK_TENDOF_DOC_UPLOAD":
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "read") {
          //get sender rec and check stage
          const filt = p.sender._filter.filters;
          var myPK;
          filt.forEach(function(ele) {
            if (ele.field == "TK_TENDOF_TK_TENDER_ID") myPK = ele.value;
          });
          //  myPK = p.sender._filter.filters[0].value;
          // var senderGrid = $('#GARE_INVIT_LIST')
          if (myPK && myPK != undefined) {
            var senderRec = $("[gridname='GARE_INVIT_LIST']")
              .data("kendoGrid")
              .dataSource.get(myPK);
            console.log(senderRec);
            if (senderRec.TK_TENREF_PROT_DATE)
              $("[gridname='TK_TENDOF_DOC_UPLOAD']")
                .children()
                .find(".k-grid-save-changes")
                .remove();
          } else if (myPK == undefined)
            $("[gridname='TK_TENDOF_DOC_UPLOAD']")
              .children()
              .find(".k-grid-save-changes")
              .remove();
        }
      };
      break;
    case "TK_VI_CROSS_TENREF":
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == "read") {
          //get sender rec and check stage
          var myPK = p.sender._filter.filters[0].value;
          var senderGrid = $("#" + grid.gridcode + "").parents("div[gridname]");
          var senderRec = senderGrid.data("kendoGrid").dataSource.get(myPK);
          //if stage != DET remove all toolbar button x the grid
          if (
            (senderRec &&
              senderRec.EV_STAGE_CODE &&
              senderRec.EV_STAGE_CODE != "PROCAFF") ||
            senderGrid.data("kendoGrid").options.code == "TK_VI_COMEVA_LIST"
          )
            removeGridButton(grid.gridcode);
        }
      };
      break;
    case "GARE_GENERAL":
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) della grid alla chiusura della popup
        origedit.call(this, e);

        //  var mioTab = $('.k-tabstrip-top').data("kendoTabStrip");
        var mioTab = $("#tabstrippopup").data("kendoTabStrip");
        if (e.model.EV_STAGE_CODE.length) {
          var stage = e.model.EV_STAGE_CODE;
          var steps = JSON.parse(e.model.JSON_STEPS);

          if (steps.tk_tipten_flag_affidamento === "0")
            mioTab.disable(mioTab.tabGroup.children().eq(1));

          if (steps.tk_tipten_flag_agg_provv === "0")
            mioTab.disable(mioTab.tabGroup.children().eq(2));

          if (steps.tk_tipten_flag_agg_def === "0")
            mioTab.disable(mioTab.tabGroup.children().eq(3));

          switch (stage) {
            case "DET":
              mioTab.disable(mioTab.tabGroup.children().eq(1));
              mioTab.disable(mioTab.tabGroup.children().eq(2));
              //mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
            case "PROCAFF":
              mioTab.disable(mioTab.tabGroup.children().eq(2));
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
            case "PROV":
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
          }
        } else {
          mioTab.disable(mioTab.tabGroup.children().eq(1));
          mioTab.disable(mioTab.tabGroup.children().eq(2));
          mioTab.disable(mioTab.tabGroup.children().eq(3));
        }
      };
      break;
    case "TK_VI_TENDER_LIST":
    case "DASH_TD_GARE_GEN":
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) della grid alla chiusura della popup
        origedit.call(this, e);

        var mioTab = $(".k-tabstrip-top").data("kendoTabStrip");
        if (e.model.EV_STAGE_CODE.length) {
          var stage = e.model.EV_STAGE_CODE;
          var steps = JSON.parse(e.model.JSON_STEPS);

          if (steps.tk_awacri_flag_affidamento === "0")
            mioTab.disable(mioTab.tabGroup.children().eq(1));

          if (steps.tk_awacri_flag_agg_provv === "0")
            mioTab.disable(mioTab.tabGroup.children().eq(2));

          if (steps.tk_awacri_flag_def === "0")
            mioTab.disable(mioTab.tabGroup.children().eq(3));

          switch (stage) {
            case "DET":
              mioTab.disable(mioTab.tabGroup.children().eq(1));
              mioTab.disable(mioTab.tabGroup.children().eq(2));
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
            case "PROCAFF":
              mioTab.disable(mioTab.tabGroup.children().eq(2));
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
            case "PROV":
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
          }
        } else {
          mioTab.disable(mioTab.tabGroup.children().eq(1));
          mioTab.disable(mioTab.tabGroup.children().eq(2));
          mioTab.disable(mioTab.tabGroup.children().eq(3));
        }
      };
      break;
    case "TK_REFCON_contract_refere":
    case "SR_CORPORATE_COMPOSITION":
    case "SVICOM_CORPORATE_COMP":
    case "SORGENTE_CORPORATE_COMP":
      includejs(
        "/Custom/" + window.ApplicationCustomFolder + "/Scripts/refereAction.js"
      );
      break;
    case "US_V_users":
      if (window.UserIsDeveloper == "True") {
        grid.columns.push({
          command: {
            text: getObjectText("loginAs"),
            click: loginAs,
          },
          title: "",
          width: "90px",
        });
      }
      break;
    case "AS_ASSET_asset":
      if (
        $("#treecontainer").length === 0 &&
        grid.columns[0].command != undefined
      ) {
        grid.selectable = "row";
        pushCustomGroupToolbarButton(
          grid,
          [
            //downloadtemplates["downloadmaintenanceplan"], downloadtemplates["downloadmaintenancemanual"],
            '<a onclick="showAssetImagesGallery(this);" class="k-button k-button-icontext">\
                     <span class="fa fa-picture-o" aria-hidden="true"></span>' +
              getObjectText("imggallery") +
              "</a>",
          ],
          "Reports"
        );
      }
      $(grid.columns).each(function(i, v) {
        if (v.field == "AS_ASSET_ADDRESS") v.template = assetAddressTemplate;
      });
      break;
    case "V_STREET_INSERT":
      pushCustomGroupToolbarButton(
        grid,
        [
          //downloadtemplates["downloadmaintenanceplan"], downloadtemplates["downloadmaintenancemanual"],
          '<a onclick="downloadStaticGmaps(this);" class="k-button k-button-icontext">\
                     <span class="fa fa-map" aria-hidden="true"></span>Download static gmaps</a>',
        ],
        "Gmaps"
      );
      break;
    //Marco Report Itea
    case "PL_VI_EXCTRACT_ASSET":
      //single button
      //   grid.toolbar.push({ template: downloadRepImpianti['libroImpianti']});
      pushCustomGroupToolbarButton(
        grid,
        [
          downloadReports["libroImpianti"],
          downloadReports["libroImpianti_clima"],
          //downloadtemplates["downloadmaintenanceplan"], downloadtemplates["downloadmaintenancemanual"],
        ],
        "Reports"
      );
      break;

    case "AS_V_ASSET_List":
      pushCustomGroupToolbarButton(
        grid,
        [
          //downloadtemplates["downloadmaintenanceplan"], downloadtemplates["downloadmaintenancemanual"],
          '<a onclick="showAssetImagesGallery(this);" class="k-button k-button-icontext">\
                     <span class="fa fa-picture-o" aria-hidden="true"></span>' +
            getObjectText("imggallery") +
            "</a>",
        ],
        "Reports"
      );
      break;
    case "WF_V_ACTCAL_activities_calendar":
      if (!window.actionColumnIsFirst)
        grid.columns.push({
          title: getObjectText("actions"),
          width: "50px",
          template: "#= getactivityactionscolumn() #",
          filterable: false,
        });
      else
        grid.columns.unshift({
          title: getObjectText("actions"),
          width: "50px",
          template: "#= getactivityactionscolumn() #",
          filterable: false,
        });
      grid.Editable = false;
      break;
    case "US_PROARE_process_area":
      //aggiungo una gestione al dataBound standard
      var PROAREdatabound = grid.dataBound;
      grid.dataBound = function(e) {
        PROAREdatabound.call(this, e);
        refreshv_us_magicgrids.call(this, e);
        refreshv_us_magicfunctions.call(this, e);
      };
      break;
    case "JO_JOBANA_job_steps":
      grid.dataSource.sort = {
        field: "JO_EXEORD_ORDINE",
        dir: "asc",
      };
      grid.columns.push({
        command: {
          text: getObjectText("RecordElaborati"),
          click: open_jobrec,
        },
        title: "",
        width: "140px",
      });
      var JOBANAdatabound = grid.dataBound;
      grid.dataBound = function(e) {
        JOBANAdatabound.call(this, e);
        bindproaredrop.call(this, e);
      };
      break;
    case "DO_V_DOCUME_IMG":
    case "DO_V_DOCUME_ENTITY_IMG":
      case "DO_V_DOCUME_IMAGE":
      var add = true;
      $(grid.columns).each(function(i, v) {
        if (v.ispresent) add = false;
      });
      if (add)
        grid.columns.push({
          command: {
            text: getObjectText("imggallery"),
            click: showImagesGallery,
          },
          title: "",
          width: "140px",
          ispresent: true,
        });
      break;
    case "DO_V_DOCUME":
      //  grid.toolbar.push({ template: downloadtemplates["downloadlabels"] });
      // disabilitato perchè creata stampa word per l'etichetta

      grid.change = function(e) {
        var cell = e.sender.content.find(".k-state-focused");
        if (cell.length) {
          if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(cell[0]);
            range.select();
          } else if (window.getSelection) {
            var selection = window.getSelection(),
              range = document.createRange();
            range.selectNode(cell[0]);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      };
      break;
    case "DO_V_DOCUME_MONITOR":
    case "WF_V_DOCACT_Documents_activity":
      grid.columns.push({
        command: {
          text: getObjectText("download"),
          click: downloadfiles,
        },
        title: "",
        width: "140px",
      });
      break;
    case "AS_V_STRUCTURE_ASSET_PRIOR":
    case "AS_V_ASSET_STRUCTURE_Recursive":
      grid.dataSource.group = {
        field: "AS_TIPSTR_DESCRIPTION",
        dir: "asc",
      };
      grid.dataSource.order = {
        field: "AS_TIPSTR_DESCRIPTION",
        dir: "asc",
      };
      break;
    case "FP_ATTIVITA_GRID":
    case "FP_ATTIVITA_CONS_GRID":
      grid.dataSource.group = {
        field: "FC_GENELE_DESCRIPTION",
        dir: "asc",
      };
      grid.dataSource.order = {
        field: "FC_GENELE_DESCRIPTION",
        dir: "asc",
      };
      break;
    case "FP_INTERVETION_prog":
    case "FP_INTERVETION_COR":
      grid.dataSource.group = {
        field: "FC_SPEELE_DESCRIPTION",
        dir: "asc",
      };
      $(grid.columns).each(function(i, v) {
        if (v.field == "FP_TFAULT_DESCRIPTION") v.template = faultReport;
      });
      break;
    case "FP_VI_INTERVETION_SET":
    case "FP_VI_INTERVETION_SET_COR":
    case "FP_INTDAT_AGRREGATE":
      grid.dataSource.group = {
        field: "FC_SPEELE_DESCRIPTION",
        dir: "asc",
      };
      break;
    case "SK_ACTPER_activity_period":
      var origedit = grid.edit;
      grid.edit = function(e) {
        //$("#SK_ACTPER_TO").kendoDatePicker({
        //    format: "dd/MM",
        //    parseFormats: ["dd/MM"] //format also will be added to parseFormats
        //});
        $("#SK_ACTPER_TO")
          .data("kendoDatePicker")
          .min($("#SK_ACTPER_FROM").val());
        //origedit.call(this, e);
      };
      break;
    case "SK_VI_INTERV_TO_DO_L":
      grid.toolbar.push({
        template:
          '<a onclick="openMaintenanceGantt(this);" class="k-button k-button-icontext">\
                                            <span class="fa fa-tasks" aria-hidden="true"></span>' +
          getObjectText("Gantt") +
          "</a>",
      });
      break;
    case "SK_V_Associated_cards":
      grid.dataSource.group = {
        field: "SK_TIPCAR_DESCRIPTION",
        dir: "asc",
      };
      break;
    //case "PRW_VI_PRIANA_L":
    //    includejs('/Custom/' + window.ApplicationCustomFolder + '/Scripts/itergara.js');
    //    break;

    case "TKN_VI_CONTRA_UTILITIES_L":
    case "TKN_VI_CONTRA_GLOBAL_L":
    case "TKN_VI_CONTRA_WORKS_L":
    case "TKN_VI_CONTRA_ORDCONTRA_L":
    case "TKN_VI_CONTRA_ORDEXTRA_L":
    case "TKN_VI_CONTRA_ORDCONTRA_L":
    case "TKN_VI_WORORD_N_CONTRA":
    case "TKN_VI_INVOIC_L":
    case "TKN_VI_INVOIC_L_PAYMENTS":
    case "TKN_VI_INVOIC_L_UTENZE":
    case "TKN_VI_INVOIC_L_NOTCRE":
    case "TKN_VI_INVOIC_L_FREE":
      RemoveCommandsFromToolbar(grid); //Gestione rimozione comandi dalla toolbar
      break;
    //case "AS_US_VI_ASSET_REFASS_ASS_MC":
    //    editRefassCad(grid);
    //    break;

    case "ST_VI_VALUE_OMI_ED":
      var origindataBinding = grid.dataBinding;

      grid.dataBinding = function(e) {
        if (origindataBinding) origindataBinding.call(this, e);

        if (
          $(e.sender.element)
            .data("kendoGrid")
            .select().length > 0
        ) {
          refreshChimanteR3(this);
        }
      };

      break;

    case "ST_VI_PLAMAR_EDIREN_L":
      var origindataBinding = grid.dataBinding;

      grid.dataBinding = function(e) {
        if (origindataBinding) origindataBinding.call(this, e);

        if (
          $(e.sender.element)
            .data("kendoGrid")
            .select().length > 0
        ) {
          refreshChimanteR3(this);
        }
      };

      break;

    case "st_VI_SURFACE_ANAL_L":
      console.log(grid);
      //grid.sender.dataSource.transport.options.create.complete

      break;

    case "LE_STIP_VI_ASSUTI_L":
      if ($("div[wizard-code='contractissue']").length > 0) {
        console.log("esiste wizard");
        $("div[wizard-code='contractissue']")
          .find('a[href="javascript:void(0)"]')
          .bind("click", function(e) {
            console.log(e);
          });
      }

      break;
    case "LE_VI_VERACT_CONDOM_ACT":
    case "TK_VI_DAYBOOK_SEARCH":
    case "TK_VI_DAYBOOK_COMMIT":
      var origindataBinding = grid.dataBinding;
      grid.dataBinding = function(e) {
        if (origindataBinding) origindataBinding.call(this, e);
        var storedprocedurename = "core.TK_SP_GET_SEL_PARAM";
        var data = {};
        data.GRID_NAME = "TK_VI_DAYBOOK_PARAMETER";

        var a = buildXMLStoredProcedureReturnDataSet(
          data,
          storedprocedurename,
          null
        );
        var str = "";
        a.then(function(e) {
          if (e && e.length > 0) {
            var data = e[0][0];
            if ($("#DIV_SEL_PARAM").length) $("#DIV_SEL_PARAM").remove();

            var html =
              '<div class="row" id="DIV_SEL_PARAM"><div class="col-sm-12"><h2>Condominio:&nbsp;' +
              data.PAR_TITLE +
              '</h2></div><div class="col-sm-12"><h3>Periodo selezionato dal:&nbsp;' +
              data.PAR_DATE_FROM +
              "&nbsp;al:&nbsp;" +
              data.PAR_DATE_TO +
              "</h3></div></div>";
            $(html).insertAfter($(".page-title"));
          }
        });
      };

      break;
    case "TKN_VI_INVOIC_ENTORD_L_ADVANCE_AMCO","TKN_VI_INVOIC_ENTORD_L_ADVANCE","PAY_VI_ANAREV_L_COMP":
      //var originDataBound = grid.dataBound;
      //grid.dataBound = function (e) {
      //    if (originDataBound) {
      //        originDataBound.call(this, e);
      //    }

      //};
      grid.navigatable = false;

      break;
  }

  //#region event actions prerender GENERAL
  try {
    //check if dwg view has to be added
    if (grid.gridExtension && grid.gridExtension.show_2dviewer)
      grid.toolbar.unshift({
        template:
          '<a class="k-button pull-right" title="2D viewer" data-role="tooltip" href="javascript:void(0)" onclick="showGridDwg(this)"><span class="fa fa-building"></span></a>',
      });

    if (grid.gridExtension && grid.gridExtension.show_3dviewer)
      grid.toolbar.unshift({
        template:
          '<a class="k-button pull-right" title="3D viewer" data-role="tooltip" href="javascript:void(0)" onclick="showAdhoxViewer(this)"><span class="fa fa-building"></span></a>',
      });
    //filtro su base grafico del dashboard
    if (sessionStorage.getItem("graphFiltersToAdd") != null) {
      var graphFil = JSON.parse(sessionStorage.getItem("graphFiltersToAdd"));
      if (graphFil.gridName.toUpperCase() == grid.code.toUpperCase()) {
        sessionStorage.removeItem("graphFiltersToAdd");
        graphFil.filter.type = "graphFil";
        grid.dataSource.filter = combineDataSourceFilters(
          grid.dataSource.filter,
          graphFil.filter
        );
      }
    }
  } catch (err) {
    console.log("Problems during graph filter evaluation.");
  }
  if (typeof getHelpActionsFromToolbarButton === "function") {
    grid.toolbar.push({
      template:
        '<a class="k-button pull-right" title="Aiuto" data-role="tooltip" href="javascript:void(0)" onclick="getHelpActionsFromToolbarButton(this)"   ><i class="fa fa-question color-blu3" ></i></a>',
    });
  }

  //se la 1a colonna "dati" e' un bool aggiungo un button che la filtra a true e toglie il filtro

  var firstcol = {
    name: "",
    title: "",
  };
  $(grid.columns).each(function(i, v) {
    if (!v.command && v.field && grid.dataSource.schema.model.fields[v.field]) {
      if (grid.dataSource.schema.model.fields[v.field].type == "boolean") {
        firstcol.name = v.field;
        firstcol.title = v.title;
      }
      return false;
    }
  });
  if (firstcol.name != "") {
    var add = true;
    //aggiungo un button per il filtro della colonna
    $(grid.toolbar).each(function(i, v) {
      if (typeof v.template == "string" && v.template.indexOf("assocman") != -1)
        add = false;
    });
    if (add) {
      grid.toolbar.push({
        template:
          '<a title="Filter association" class="k-button k-button-icontext assocman" onclick="filterUnfilter(this,\'' +
          firstcol.name +
          '\');" href="javascript:void(0)"><span class="k-icon k-i-funnel"></span>' +
          getObjectText("showlinked") +
          "</a>",
        type: "filterSelected",
      });
      grid.toolbar.push({
        template:
          '<a title="Select all" class="k-button k-button-icontext assocman" onclick="selectAllRows(this,\'' +
          firstcol.name +
          '\');" href="javascript:void(0)"><i class="fa fa-check-square-o"></i></a>',
        type: "selectAll",
      });
      grid.toolbar.push({
        template:
          '<a title="Unselect all" class="k-button k-button-icontext assocman" onclick="selectAllRows(this,\'' +
          firstcol.name +
          '\', true);" href="javascript:void(0)"><i class="fa fa-square-o"></i></a>',
        type: "unselectAll",
      });
    }
  }
  //aggiunta dell' expand collapse button se la griglia e' groupable
  if (grid.groupable != false) {
    var add = true;
    //aggiungo un button per il filtro della colonna
    $(grid.toolbar).each(function(i, v) {
      if (typeof v.template == "string" && v.template.indexOf("collman") != -1)
        add = false;
    });
    if (add)
      grid.toolbar.push({
        template:
          '<a title="Collapse/Expand" class="k-button k-button-icontext collman" onclick="collapseExpand(this);" href="javascript:void(0)"><span class="k-icon k-i-collapse"></span>Collapse</a>',
      });
  }

  query_for_template_document(grid, {
    stored: "core.PS_USP_GET_TIPMOD_FOR_GRID",
    formTableName: "core.PS_V_MODINP_input_tipmod",
    controllerName: "Documentale",
    renderModelClassesFunction: function(items) {
      var modelClasses = {};
      $.each(items, function(k, item) {
        var modelType = {
          id: item.PS_TIPMOD_ID,
          code: item.PS_TIPMOD_CODE,
          description: item.PS_TIPMOD_DESCRIPTION,
          batch: item.PS_TIPMOD_FLAG_BATCH,
          outId: item.PS_TIPMOD_PS_TIPOUT_ID,
          outCode: item.PS_TIPOUT_CODE,
          outDescription: item.PS_TIPOUT_DESCRIPTION,
        };

        if (item.PS_TIPMOD_PS_CLAMOD_ID in modelClasses) {
          modelClasses[item.PS_TIPMOD_PS_CLAMOD_ID].modelTypes.push(modelType);
        } else {
          modelClasses[item.PS_TIPMOD_PS_CLAMOD_ID] = {
            code: item.PS_CLAMOD_CODE,
            description: item.PS_CLAMOD_DESCRIPTION,
            modelTypes: [modelType],
          };
        }
      });
      return modelClasses;
    },
  }); 

  //se c'e' una mappa aperta sotto una griglia Dwg o google con tree la chiudo se viene fatto un nuovo filtro ...
  //tolgo history e actions se sono su una extension grid
  var origdatabound__ = grid.dataBound;
  grid.dataBound = function(e) {
    if (origdatabound__ != null) origdatabound__.call(this, e);
    hideGroupedColumns.call(this, e);
    triggercollapse.call(this, e);
    resetSelectAll.call(this, e);
    checkForSessionGroupFilters.call(this, e);
    if (grid.gridExtension) {
      if (grid.gridExtension.show_2dviewer) {
        var dwgController = $("#grid-dwg-controller");
        if (dwgController && dwgController.length) {
          kendo.destroy(".gd-dg-viewer");
          dwgController.remove();
        }
      }
      if (grid.gridExtension.show_tree_map) {
        //This is set only when the map itself filters the grid !!! (Magic_TreeGoogleMapController.js setGridFilter())
        var mapIsFiltering = e.sender.element.attr("innerGmapfilter");
        if (!mapIsFiltering) {
          var mapController = $("#tree-map-controller");
          if (mapController && mapController.length) {
            kendo.destroy(".gd-dg-viewer");
            mapController.remove();
          }
        } //reset the inner gmap filter attribute
        else e.sender.element.removeAttr("innerGmapfilter");
      }
    }
  };
  var origdatabinding_ = grid.dataBinding;
  grid.dataBinding = function(e) {
    if (origdatabinding_) origdatabinding_.call(this, e);
    if (e.sender.wrapper.closest(".k-window").length == 0)
      e.sender.hideColumn("EDITCOLUMN");
    //special column usable to Hide other grids inside popup grid edit
    else e.sender.showColumn("EDITCOLUMN");
  };
  //gestione dei grid contraints dopo la modifica incell
  if (grid.editable == true) {
    var datasourcechange_ = grid.dataSource.change;
    grid.dataSource.change = function(e) {
      if (datasourcechange_) datasourcechange_.call(this, e);
      //called per each modification to grid's datasource. The database receives as input the data of the record which contains modifications and returns the list of fields to be changed as value. Modifications are made in the function itself

      //added check which does not check the constraints if the action is an add and if the grid is on a wizard
      //the data passed to the constraints is not containing the injected filters to the grid
      //after the call to this event with the action "add", another event is triggered, with the action "sync" and the data passed to the constraints with the right filters and values

      if (e.action === "add" && $(grid).closest("ng-wizard")) {
        return;
      }
      $.each(e.items, function(i, v) {
        try {
          manageStageInCellConstraints
            .call(this, v, grid.gridcode, grid.EntityName, e.field, e.action)
            .then(function(fields) {
              if (fields && fields.items && fields.items.length)
                $("tr[data-uid=" + v.uid + "]")
                  .closest(".k-grid")
                  .data("kendoGrid")
                  .refresh();
            });
        } catch (ex) {
          console.log(ex);
        }
      });
    };
  }

  //aggiungo al databound di tutte le griglie un metodo che dati gli stage dei record caricati va a richiamare i vincoli di edit del record/colonne
  var origedit__ = grid.edit;
  grid.edit = function(e) {
    var defVal_model_fn = function(defaultValue) {
      if (defaultValue.indexOf("{") != -1)
        return JSON.parse(defaultValue).value;
      else return defaultValue;
    };
    var gridcode = grid.gridcode;
    var gridentity = grid.EntityName;
    e.entityName = gridentity;
    if (e?.sender?.options?.editable?.mode =="popup")
       getfunctionsforPopUp(e);
    e.xmlFieldsToAlter = {};
    var defvals = {};

    var isSchemaFormGrid = false;
    if (e && e.sender && e.sender.options && e.sender.options.editable) {
      if (
        e.sender.options.isSchemaFormGrid &&
        (e.sender.options.editable == true ||
          e.sender.options.editable == "incell")
      ) {
        isSchemaFormGrid = true;
      }
    }
    doModal(true);
    gridWaitForConstraintCall(gridcode).then(() => {
      doModal(false);
      let constraintsEnabled = areConstraintsEnabled(e.sender.element);
      if (!constraintsEnabled) {
        if (origedit__ != null) origedit__.call(this, e);
        return;
      }

      manageStageConstraints
        .call(this, e, gridcode, gridentity, null, isSchemaFormGrid)
        .then(function(items) {
          $(
            items.filter(function(x) {
              return x.EV_STACOL_COLUMN_ID != -1;
            })
          ).each(function(i, v) {
            if (v.IsXml)
              e.xmlFieldsToAlter[v.ColumnName] = {
                columnname: v.ColumnName,
                required: v.EV_STACOL_B_REQUIRED,
                editable: v.EV_STACOL_B_EDITABLE,
                defvalue: v.EV_DEFAULT_VALUE,
                hide: v.EV_STACOL_B_HIDDEN,
                label: v.label,
              };
            if (v.EV_DEFAULT_VALUE) {
              e.model.set(v.ColumnName, defVal_model_fn(v.EV_DEFAULT_VALUE));
              defvals[v.ColumnName] = {
                value: defVal_model_fn(v.EV_DEFAULT_VALUE),
                editable: v.EV_STACOL_B_EDITABLE,
              };
            }
          });
          var addReadOnlyFieldsOutsideModel = function(e, items) {
            try {
              var fieldsToAddAsReadOnly = items.filter(function(x) {
                return x.EV_STACOL_COLUMN_ID == -1;
              });
              if (fieldsToAddAsReadOnly.length)
                $.get(
                  "/Views/3/Templates/PopUp_ConstraintsAdditionalFields.html"
                ).then(function(html) {
                  var formclass = e.container
                    .find("#tabstrippopup-1")
                    .find(".row")
                    .attr("class");
                  var fieldclass = e.container
                    .find("#tabstrippopup-1")
                    .find(".row")
                    .find("[class^='col-']")
                    .attr("class");
                  var field =
                    '<div class="{2}">\
									<div class="k-edit-label">\
										<label for="{0}">{1}</label>\
									</div >\
									<div class="k-edit-field">\
										<input type="text" id="{0}" readonly class="k-input k-textbox" disabled="disabled" name="{0}" value="{3}"/>\
									</div>\
								</div>';
                  var htmltoAdd = "";
                  $(fieldsToAddAsReadOnly).each(function(i, v) {
                    var cname = v.ColumnName;
                    var label = v.label;
                    var val = v.EV_DEFAULT_VALUE;
                    htmltoAdd += field.format(
                      cname,
                      label,
                      fieldclass,
                      val ? val : ""
                    );
                  });
                  html = html.format(formclass, htmltoAdd);
                  e.container.find("#tabstrippopup-1").prepend(html);
                });
            } catch (ex) {
              console.log(ex);
            }
          };
          if (origedit__ != null) {
            var promise = origedit__.call(this, e);
            try {
              if (promise) {
                //gestione delle cascade + valori impostati da DB per le drop down
                $.when(promise).then(function(selectDataBounds) {
                  addReadOnlyFieldsOutsideModel(e, items);
                  var all = function(array) {
                    var deferred = $.Deferred();
                    var fulfilled = 0,
                      length = array.length;
                    var results = [];

                    if (length === 0) {
                      deferred.resolve(results);
                    } else {
                      array.forEach(function(promise, i) {
                        $.when(promise).then(function(value) {
                          results[i] = value;
                          fulfilled++;
                          if (fulfilled === length) {
                            deferred.resolve(results);
                          }
                        });
                      });
                    }

                    return deferred.promise();
                  };
                  var promisesarray = [];
                  $.each(selectDataBounds, function(i, v) {
                    promisesarray.push(v);
                  });
                  //when all the FK data has been loaded into the form
                  $.when(all(promisesarray)).then(function(results) {
                    setTimeout(function() {
                      $.each(defvals, function(k, v) {
                        if (
                          e.container
                            .find("input[name=" + k + "]")
                            .data("kendoDropDownList")
                        ) {
                          e.container
                            .find("input[name=" + k + "]")
                            .data("kendoDropDownList")
                            .value(defvals[k].value);

                            e.model.set(k, defvals[k].value);

                          //hide the validation tooltips...it has a value!
                          e.container
                            .find("input[name=" + k + "]")
                            .closest("div.k-edit-field")
                            .find("span.k-tooltip-button")
                            .find("a.k-icon.k-i-close")
                            .trigger("click");
                          if (!defvals[k].editable)
                            e.container
                              .find("input[name=" + k + "]")
                              .data("kendoDropDownList")
                              .enable(false);
                        }
                      });
                    }, 1000);
                  });
                });
              } //TODO understrand why in some cases the promise is not evaluated
              else
                setTimeout(function() {
                  addReadOnlyFieldsOutsideModel(e, items);
                }, 2000);
            } catch (ex) {
              console.log(ex);
            }
          }
        });
    });
  };

  if (
    typeof supportURL !== "undefined" &&
    supportURL //&&
    //&& location.host === "dev.reftree.it"
    //ApplicationInstanceName === 'dev'
  ) {
    grid.toolbar.unshift({
      template:
        '<a title="' +
        getObjectText("reportError") +
        '" class="k-button pull-right" href="javascript:void(0)" onclick="reportToHelpDesk(this)"><span class="fa fa-exclamation-triangle"></span></a>',
    });
  }

  //if (grid.gridcode in ("RSN_VI_IMPDWG_import_dwg_superfici_L", "RSN_VI_IMPDWG_import_dwg_L")) {
  //    var origDataSOurceRequestEnd__ = grid.dataSource.requestEnd;

  //    grid.dataSource.requestEnd = function (e) {
  //        if (origDataSOurceRequestEnd__) {
  //            origDataSOurceRequestEnd__.call(this, e);
  //        }

  //        if (grid.gridExtension.reloadDashboard) {
  //            refreshGridInFunction(grid,e);
  //        }
  //    }
  //}

  //#endregion
  return;
}

function setHeaderColumn(columnName, color) {
  $.each(columnName, function(i, v) {
    $('th[data-field="' + v + '"]')
      .find("a")
      .css("color", color)
      .css("font-weight", "bold");
  });
}

function dispatchPopUpAction(e, jsonpayload) {
  requireConfigAndMore(["MagicActions"], function(magic) {
    switch (jsonpayload.actiontype) {
      case "NEWGD":
      case "EDTGD":
        editActionGrid(e, jsonpayload);
        break;
      case "SQLPU":
        launchStoredProcedure(e, jsonpayload);
        break;
      case "SHOGD":
        showGrid(e, jsonpayload);
        break;
      case "JSFUU":
        launchActionJsFunctionPers(e, jsonpayload);
        break;
      case "R3BDOC":
        launchReftreeBuildDocumentFromModel(e, jsonpayload);
        break;
    }
  });
  console.log("dispatchPopUpAction");
}
//this gets the actions when opening a popup and if any is defined adds a span aside the save button which opens the action accordion on click
function getfunctionsforPopUp(e) {
  var dbcalls = ["customactions", "stageactions"];
  var jrow = e.sender.element.find("tr[data-uid=" + e.model.uid + "]");
  var rowdata = e.model;
  var entityName = e.entityName;
  var functionGUID = getCurrentFunctionGUIDFromMenu();
  var pk = e.sender.dataSource.options.schema.model.id;
  var gridname = e.sender.element.attr("gridname");
  requireConfigAndMore(["MagicActions"], function(magic) {
    //id 3o livello , class: 1o liv , Type : 2oliv
    $.each(dbcalls, function(i, v) {
      $.ajax({
        type: "POST",
        url: "/api/EVENTS/GetRecordActions/",
        data: JSON.stringify({
          entityname: entityName,
          id: rowdata.id,
          pk: pk,
          queryType: v,
          functionGUID: functionGUID,
          gridName: gridname,
          isPopUp: true,
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(result) {
            var boid = rowdata.id;

            if (result.length) {
                var iCount = $.unique(result.map(function (d) { return d.Type })).length;


                $.each($.unique(result.map(function (d) { return d.Type })), function (i, v) {
                    var $div;
                    var $btn;

                    if (iCount > 1) {
                        $div = $('<div class="btn-group dropup navbar-btn" style="margin:5px; float: left;" ></div>');
                        $btn = $(
                            '<button class="btn btn-success dropdown-toggle" style="border-top-left-radius: 4px;border-bottom-left-radius: 4px;" type="button" data-toggle="dropdown">' + v + '<span style="margin-left: 5px;" class="fa fa-bars"></span></button>'
                        );

                        var $ul = $('<ul class="dropdown-menu"></ul>')
                        $btn.append($ul);
                    } else {
                        $div = $('<div class="btn-group" style="margin:5px; float: left;" ></div>');
                    }
                     
                    result.filter(function (vv) {
                        if (vv.Type == v) {

                            var jsonpayload = {};
                            jsonpayload.id = vv.ActionId;
                            jsonpayload.Typeid = vv.TypeId;
                            jsonpayload.Type = vv.Type;
                            jsonpayload.Classid = vv.ClassId;
                            jsonpayload.Class = vv.Class;
                            jsonpayload.actionDescription = vv.ActionDescription;
                            jsonpayload.actiontype = vv.ActionType;
                            jsonpayload.actioncommand = vv.ActionCommand;
                            jsonpayload.actionfilter = vv.ActionFilter;
                            jsonpayload.actioniconclass = vv.ActionIconClass;
                            jsonpayload.actionbackgroundcolor = vv.ActionBackgroundColor;
                            jsonpayload.typeiconclass = vv.TypeIconClass;
                            jsonpayload.rowData = rowdata;
                            jsonpayload.jqgrid = e.sender.element;
                            jsonpayload.jrow = jrow;

                            if (iCount > 1) {
                                var $li = $('<li style="cursor:pointer"></li>');
                                var $a = $('<a style="cursor:pointer" href="javascript:void(0)">' + vv.ActionDescription + '</a>');

                                $a.click(function () {
                                    //performs the original grid save
                                    e.sender.dataSource.sync().then(function () {
                                        e.container.data("kendoWindow").close();
                                        dispatchPopUpAction($a, jsonpayload);
                                    });
                                    //dispatchPopUpAction($a, jsonpayload);
                                });

                                $li.append($a);
                                $ul.append($li);
                            } else {
                                $btn = $(
                                    '<button class="btn btn-success dropdown-toggle" style="border-top-left-radius: 4px;border-bottom-left-radius: 4px;" type="button">' + vv.ActionDescription + '</button>'
                                );

                                $btn.click(function () {
                                    //performs the original grid save
                                    e.sender.dataSource.sync().then(function () {
                                        e.container.data("kendoWindow").close();
                                        dispatchPopUpAction($btn, jsonpayload);

                                    });
                                });

                                $div.append($btn);
                            }
                            
                            return vv;
                        }
                    });

                    if (iCount > 1) {
                        $div.append($ul);
                        $div.append($btn);
                    }
                    
                    e.container
                        .find("div.k-edit-buttons.k-state-default")
                        .prepend($div);
                    
                });
            }

            //if (result.length) {
            //    //create an action btn for each ...
            //    $(result).each(function (i, v) {

            //        var jsonpayload = {};
            //        jsonpayload.id = v.ActionId;
            //        jsonpayload.Typeid = v.TypeId;
            //        jsonpayload.Type = v.Type;
            //        jsonpayload.Classid = v.ClassId;
            //        jsonpayload.Class = v.Class;
            //        jsonpayload.actionDescription = v.ActionDescription;
            //        jsonpayload.actiontype = v.ActionType;
            //        jsonpayload.actioncommand = v.ActionCommand;
            //        jsonpayload.actionfilter = v.ActionFilter;
            //        jsonpayload.actioniconclass = v.ActionIconClass;
            //        jsonpayload.actionbackgroundcolor = v.ActionBackgroundColor;
            //        jsonpayload.typeiconclass = v.TypeIconClass;
            //        jsonpayload.rowData = rowdata;
            //        jsonpayload.jqgrid = e.sender.element;
            //        jsonpayload.jrow = jrow;

            //        var $btn = $(
            //            '<a class="k-button k-button-icontext k-primary" href="javascript:void(0)"><span class="k-icon k-update"></span>' +
            //            v.ActionDescription +
            //            "</a>"
            //        );
            //        e.container
            //            .find("div.k-edit-buttons.k-state-default")
            //            .append($btn);
            //        $btn.click(function () {
            //            //performs the original grid save
            //            e.sender.dataSource.sync().then(function () {
            //                e.container.data("kendoWindow").close();
            //                dispatchPopUpAction($btn, jsonpayload);
            //            });
            //        });
            //    });               
            //}



        },
        error: function(result) {
          console.log("Error getting popUp actions");
        },
      });
    });
  });
  return;
}

function postrenderdispatcher(grid, functionname, e) {
  //custom code for specific grids
  if (
    grid.code === "US_CLAGRU_class_group" ||
    grid.code === "US_CLAVIS_class_visibility"
  ) {
    $("[gridname='" + grid.code + "']").wrap('<div class="col-md-12">');
    $("[gridname='" + grid.code + "']").before(
      "<h3>" + getObjectText(grid.code) + "</h3>"
    );
    $("#appcontainer br").remove();
  }
  if (grid.code === "PRW_VI_PRIANA_L") {
    var kGrid = e.detailRow.find("#PRW_VI_PRIANA_L").data("kendoGrid");
    kGrid.bind("edit", function(e) {
      inLineCheckConstEdit(e, kGrid);
    });
  }

  if (grid.code === "TKT_VI_PRIANA_L") {
    var kGrid = e.detailRow.find("#TKT_VI_PRIANA_L").data("kendoGrid");
    kGrid.bind("edit", function(e) {
      inLineCheckConstEdit(e, kGrid);
    });
  }

  return;
}

//#region RefTreeGeneralFeat
//toolbar button for ZIP download from selectable grid
function downloadZipFromSelectableGrid(e) {
  var targetgrid = getGridFromToolbarButton(e);
  var key = !e.id ? e.className : e.id;
  var jsonpayload = {};
  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
  } catch (e) {
    kendoConsole.log("JsonPayload is not valid", true);
    return;
  }
  if (!jsonpayload.zipSP) {
    kendoConsole.log("zipSP not specified", true);
    return;
  }
  //get selected items
  var selecteddata = [];
  var selectedIds = [];
  //selection is performed reading ids form database
  if (targetgrid.element.data("allRecords")) {
    selectedIds = $.map(targetgrid.element.data("allRecords"), function(v, i) {
      return jQuery.extend({}, v);
    });
  } else {
    //select all in current browser view
    selecteddata = targetgrid.select();
    if (detectTouch() && targetgrid.element.find(".rowselected__").length) {
      selecteddata = [];
      $.each(targetgrid.element.find(".rowselected__"), function(i, v) {
        if ($(v).prop("checked") == true) selecteddata.push($(v).closest("tr"));
      });
    }
  }
  //selection at front end side
  if (selecteddata.length > 0) {
    for (var i = 0; i < selecteddata.length; i++) {
      //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
      selectedIds.push({
        id: targetgrid.dataItem(selecteddata[i]).id,
      });
    }
  }
  $.fileDownload("/api/Documentale/ExportzipforRefTreeGrid/", {
    data: {
      gridname: targetgrid.element.attr("gridname"),
      ids: selectedIds,
      zipSP: jsonpayload.zipSP,
    },
    httpMethod: "POST",
  });
}

//check grid has at least 1 record in Wizard validation
function checkGridHasAtLeastOneRow(form, i, scope) {
  var stepKey = scope.settings.steps[i].stepKey;

  var $stepkey = $("div[data-step-key=" + stepKey + "]");

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };
  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();
  var grids = [];
  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (
      v.MagicTemplateDataRole == "detailgrid" &&
      v.Schema &&
      v.Schema.Schema_required
    ) {
      var $grid = $stepkey.find(
        "div[gridname=" + v.searchGrid.SearchGridName + "]"
      );

      var numberOfrows = $grid.data("kendoGrid")
        ? $grid
            .data("kendoGrid")
            .dataSource.data()
            .toJSON().length
        : 0;
      if (!numberOfrows) grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    return false;
  }
  return true;
}
//wizard validarion from stored procedure
function validateFromDatabase(form, i, scope, element) {
  var deferred = $.Deferred();
  var stepKey = scope.settings.steps[i].stepKey;
  var filestosave = [];
  if (element) filestosave = $("magic-form", element).data("filesToSave");
  var data = {
    wizardCode: scope.wizardCode,
    stepKey: stepKey,
    data: scope.models,
    filesToSave: filestosave,
  };
  //ask the database wether to go on
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .getDataSet(data, "CUSTOM.Magic_WizardValidation")
      .then(function(res) {
        if (res.status == 500 && res.responseText) {
          kendoConsole.log(res.responseText, true);
          deferred.reject();
        }
        deferred.resolve();
      });
  });
  return deferred.promise();
}

//executed at the end of the launchStoredProcedure action in order to perform specific actions over the DOM
function callAfterLaunchStoredProcedure(rowdata) {
  //Gestione ticket v2
  functionsinScope = ["71ad1c46-3aa0-43bb-9f11-083bbf8f4c65"];
  if (functionsinScope.indexOf(getCurrentFunctionGUID()) != -1) {
    $("#grid")
      .data("kendoGrid")
      .dataSource.read();
  }
}

///To be used in order to add Custom Html + angular pages load click (inside bootstrap modals) redmine Feature #3282
function showItemCustomFormWrap(e) {
  var jsonpayload = {};
  try {
    jsonpayload = getRowJSONPayload(e);
  } catch (e) {
    console.log(e.message);
  }
  var controllerName =
    jsonpayload && jsonpayload.controllerName
      ? jsonpayload.controllerName
      : null;
  var rowData = getRowDataFromButton(e);
  var storedProcedure = jsonpayload.storedProcedure;
  var gridName = $(e.currentTarget)
    .closest(".k-grid")
    .attr("gridname");
  //defined in AdminAreaCustomizations.js
  showItemCustomForm(rowData, gridName, storedProcedure, controllerName);
}

function showItemCustomFormFascicolo(e) {
  var jsonpayload = {};
  try {
    jsonpayload = getRowJSONPayload(e);
  } catch (e) {
    console.log(e.message);
  }
  var controllerName =
    jsonpayload && jsonpayload.controllerName
      ? jsonpayload.controllerName
      : null;
  var rowData = getRowDataFromButton(e);
  var storedProcedure = jsonpayload.storedProcedure;
  var gridName = $(e.currentTarget)
    .closest(".k-grid")
    .attr("gridname");
  //defined in AdminAreaCustomizations.js
  showItemCustomFormFas(rowData, gridName, storedProcedure, controllerName);
}

//Gestione della chiamata alla sp usp_ev_get_action_constraint nell onchange delle dropDown
function dropDownListOnChange(e) {
  let elementSelector;

  if (e.sender && e.sender.wrapper) {
    //dropdownlist case
    elementSelector = e.sender.wrapper;
  } else if (e.selector) {
    //searchGrid case
    elementSelector = e.selector;
  }
  let nameAttribute = e.sender
    ? e.sender.element.attr("name") //dropdownlist case
    : $(elementSelector).attr("name"); //searcGridCase

  e.container = [$(elementSelector).closest(".k-edit-form-container")];
  var kendoEditable = $(e.container[0])
    .parent()
    .data("kendoEditable");
  onChangeFieldmanageStageConstraints(
    e,
    nameAttribute,
    kendoEditable.options.target.element,
    kendoEditable.options.model
  );
}

/**
 * used to trigger constraints of  text inpuxt , autocomplete (compoents displaying a text).
 * @param {any} e - the element of the changed component
 * @param {any} newid - the newid in case the component can create new db elements while edited (geoautocomplete)
 */
function textOnChange(e, newid) {
  setTimeout(function() {
    if (typeof e.closest === "undefined") e = e.sender.element;

    e.container = [e.closest(".k-edit-form-container")];
    var kendoEditable = $(e.container[0])
      .parent()
          .data("kendoEditable");
      // Handle date/datetime fields
      try {
          var $element = $(e);
          if ($element.data && ($element.data("kendoDatePicker") || $element.data("kendoDateTimePicker"))) {
              var fieldName = $element.attr("name");
              var fieldValue = $element.val();
              // If the field is empty, explicitly set null in the model
              if (!fieldValue) {
                  kendoEditable.options.model[fieldName] = null;
              }
          }
      } catch (error) {
          console.warn("Warning: Error handling date/datetime fields:", error);
      }
    //if the control is an autocomplete i change the model value here before calling the database
    if (e.data && e.data("kendoAutoComplete")) {
      var ac = e.data("kendoAutoComplete");
      var tfield = ac.element.data().textField;
      var vfield = ac.element.data().valueField;
      var valOfAc = ac.value();
      //value has been set from Db , datasourceis not ready
      if (!ac.dataSource.data().length) return;
      var selectedItem = ac.dataSource.data().filter(function(x) {
        if (x[tfield] === valOfAc) return x;
      });
      if (newid || selectedItem.length)
        kendoEditable.options.model[e.attr("name")] = newid
          ? newid
          : selectedItem[0][vfield];
      if (e.data("initialDBValue") == valOfAc)
        //prevents loops when a constraint sets the value from db
        return;
    }
    onChangeFieldmanageStageConstraints(
      e,
      null,
      kendoEditable.options.target.element,
      kendoEditable.options.model
    );
  }, 100);
}

function cfTextOnChange(e) {
  var cf = $("#" + e.id).val();
  if (isFinite(cf) == true) {
    var Msg = ControllaPIVA(cf,e.id);
  } else if (isFinite(cf) == false && e.id == "LE_REFERE_TAX_CODE") {
    kendoConsole.log(
      "La partita iva non  può contenere caratteri alfanumerici",
      "info"
    );
    Msg = "";
  } else {
    var Msg = ControllaCF(cf);
  }

  if (cf.length > 1 && Msg.length > 1) {
    kendoConsole.log(Msg, "info");
  }

  textOnChange(e);
}

function showColumnGrid(e) {
  var gridtoopenname = $(e).data("gridname");
  var filter = $(e).data("filter");
  var dataItem = $(e)
    .closest(".k-grid")
    .data("kendoGrid")
    .dataItem($(e).closest("tr"));

  var tr = $(e).closest("tr");
  var kendoGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.kendo
      .getGridObject({
        gridName: gridtoopenname,
      })
      .then(function(gridobj) {
        var isMtoN = false;
        if (
          gridobj.dataSource.schema.model.fields[gridobj.columns[0].field]
            .type == "boolean"
        )
          isMtoN = true;
        if (isMtoN)
          gridobj.saveChanges = function(e) {
            e.preventDefault();
            var newdata = $.extend(e.model, e.values ? e.values : {});
            dataItem[gridtoopenname] = JSON.stringify(
              e.sender.dataSource.data()
            );
          };
        else
          gridobj.save = function(e) {
            e.preventDefault();
            var newdata = $.extend(e.model, e.values ? e.values : {});
            if (e.model.isNew()) {
              e.sender.dataSource.remove(newdata);
              e.sender.dataSource.add(newdata);
            }
            dataItem[gridtoopenname] = JSON.stringify(
              e.sender.dataSource.data()
            );
          };

        if (filter) {
          if (!filter.type)
            //only at the first opening in this row
            filtersolver(
              filter,
              gridobj,
              {
                model: dataItem,
              },
              true,
              "navigationFilter"
            );
          gridobj.dataSource.filter = combineDataSourceFilters(
            gridobj.dataSource.filter,
            filter,
            "navigationFilter"
          );
        }
        if ($("#gridinlist").data("kendoGrid")) {
          $("#gridinlist")
            .data("kendoGrid")
            .destroy();
          $("#gridinlist").remove();
        }
        if ($("#showColumnGrid").data("kendoWindow")) {
          $("#showColumnGrid")
            .data("kendoWindow")
            .destroy();
          $("#showColumnGrid").remove();
        }
        $("#appcontainer").append(
          "<div id='showColumnGrid'><div id='gridinlist'/></div>"
        );
        $("#showColumnGrid").kendoWindow({
          visible: false,
          modal: true,
        });
        $.when(
          MF.kendo.appendGridToDom({
            kendoGridObject: gridobj,
            selector: "gridinlist",
          })
        ).then(function(kgrid) {
          if (isMtoN) {
            if (kgrid.wrapper.find(".k-grid-toolbar .k-grid-add").length > 0)
              kgrid.wrapper.find(".k-grid-toolbar .k-grid-add").hide();
            //remove i comandi della delete dalla command column
            if (kgrid.wrapper.find(".k-grid-delete").length > 0)
              kgrid.wrapper.find(".k-grid-delete").hide();
          }
          $("#showColumnGrid")
            .data("kendoWindow")
            .open()
            .center();
        });
      });
  });
}
//Column template which overwrites the save method of a given grid in order to save its datasource data into a parent grid field as a JSON string
function linkListToColumnOfNewParentElement(dataItem) {
  var htmlouter =
    "<div class='list-group'>\
                       {0}\
                     </div>";
  var htmlinner =
    "<a href='#' data-gridname='{1}' {2} class='list-group-item' onclick='showColumnGrid(this);'>{0}</a>";
  var htmla = "";

  try {
    var items = JSON.parse(dataItem["EDITCOLUMN"]);
    $.each(items, function(i, v) {
      var filter = "data-filter=''";
      if (v.filter)
        filter = "data-filter='{0}'".format(JSON.stringify(v.filter));
      htmla += htmlinner.format(
        v.label[window.culture] ? v.label[window.culture] : v.label,
        v.gridname,
        filter
      );
    });
  } catch (err) {
    return "Errors parsing JSON: " + err;
  }
  return htmlouter.format(htmla);
}

function openMaintenanceGantt(e) {
  var config = {};
  config.ganttName = "TK_INTERV_order"; //mandatory
  config.treeFilter = "usp_tk_interv_tree_filter"; //optional
  config.bOSelector = {
    show: true,
    linkedBoType: [8],
  }; //optional
  config.storedProcedures = {
    tasksAndDependenciesLoad: "core.usp_tk_interv_gantt", //mandatory
    saveTasks: "core.usp_tk_interv_gantt_save", //mandatory
    saveDeps: "usp_tk_interv_gantt_deps", //mandatory
    resourcesAndAssignmentsLoad: "core.usp_tk_interv_gantt_resources", //optional
  };
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.kendo.appendGanttToDom(config); //a further parameter will be considered as the selector where the gantt will be appended. Default is modal container (parameter undefined)
  });
}

function checkForSessionGroupFilters(e) {
  //se c'e' un filtro attivo ed esiste la key GROUPS_LIST in model mostro un tooltip di warn sulla presenza di filtri sui gruppi.
  if (
    sessionStorage.getItem("groupsfilter") == "true" &&
    e.sender.dataSource.options.schema.model.fields["GROUPS_LIST"] != null
  ) {
    e.sender.element.kendoTooltip({
      position: "top",
      autoHide: true,
      hide: function() {
        $(this.popup.element[0])
          .closest(".k-animation-container")
          .remove();
      },
      content: function() {
        return "Attenzione, sono presenti dei filtri sui gruppi associabili agli elementi di questa griglia.";
      },
      width: "150px",
    });

    e.sender.element.data("kendoTooltip").show();
  }
}

function openUsGroupsTreeWindow(e) {
  require([window.includesVersion + "/Custom/3/Scripts/config.js"], function() {
    require(["groups_filter"], function() {
      showGroupsSelTree(e);
    });
  });
}
//metodo lanciato alla selezione di un elemento delle search
function custommethod(grid, selected, model, fieldinedit) {
  switch (grid.element.attr("gridname")) {
    case "SR_SEARCH_REFERE_MEMBERS": //wizard enpam/albo fornitori
      model.set(
        "NOMINATIVO",
        (selected.LE_REFERE_NAME ? selected.LE_REFERE_NAME : "") +
          (selected.LE_REFERE_LAST_NAME
            ? " " + selected.LE_REFERE_LAST_NAME
            : "")
      );
      break;
    case "PRW_VI_PRIANA_L":
    case "TKG_VI_PRIANA_L":
    case "TKT_VI_PRIANA_L":
      model.set("TK_PRICEU_DESCRIPTION", selected.TK_PRICEU_DESCRIPTION);
      break;
    case "TK_V_ASSET_SEARCH_GRID":
      if ($("#PL_ASSET_plant_assetdd").data("kendoDropDownList")) {
        $("#PL_ASSET_plant_assetdd")
          .data("kendoDropDownList")
          .dataSource.read();
      }
      break;
    case "LE_VI_REFERE_ALL":
      switch (grid.element.attr("referencefield")) {
        //case "TK_REFCON_LE_REFERE_ID":
        //    if ($("#TK_REFCON_LE_REFERE_ID_LEGAL_binder").data("kendoDropDownList")) {
        //        $("#TK_REFCON_LE_REFERE_ID_LEGAL_binder").data("kendoDropDownList").dataSource.read();

        //    }
        //    break;
        case "TK_REFCON_LE_REFERE_ID_PROXY":
          if (
            $("#TK_REFCON_LE_REFERE_ID_PROLEG_binder").data("kendoDropDownList")
          ) {
            $("#TK_REFCON_LE_REFERE_ID_PROLEG_binder")
              .data("kendoDropDownList")
              .dataSource.read();
          }
          break;
      }
    case "LE_VI_REFERE_REFERE_SIGN":
      switch (grid.element.attr("referencefield")) {
        case "TK_REFCON_LE_REFERE_ID_PROXY":
          if (
            $("#TK_REFCON_LE_REFERE_ID_PROLEG_binder").data("kendoDropDownList")
          ) {
            $("#TK_REFCON_LE_REFERE_ID_PROLEG_binder")
              .data("kendoDropDownList")
              .dataSource.read();
          }
          e = $("#TK_REFCON_LE_REFERE_ID_PROLEG_binder");
          e.container = $("#TK_REFCON_LE_REFERE_ID_PROLEG_binder").closest(
            ".k-edit-form-container"
          );

          //$("#TK_REFCON_LE_REFERE_ID_PROLEG_binder").container = [$("#TK_REFCON_LE_REFERE_ID_PROLEG_binder").closest(".k-edit-form-container")];
          //e.container.find("a[class='k-icon k-i-cancel']").click(function () {
          //    onChangeFieldmanageStageConstraints(e);
          //})

          onChangeFieldmanageStageConstraints(
            e,
            "TK_REFCON_LE_REFERE_ID_PROXY"
          );

          break;
      }
      break;
    case "AS_VI_ASSET_REFASS_MC":
    case "LEN_VI_VERACT_VOLTURA":
      //Gestisce l'anomalia dovita a searchgrid richiamata da una griglia con edit inline
      model.set("lookUpColumn", selected.Name); //campo da cui leggere la descrizione della search
      break;

    case "FE_DATREP_dati_riepilogo":
    case "FE_VI_FATRIG_L":
      //Gestisce l'anomalia dovita a searchgrid richiamata da una griglia con edit inline
      model.set("lookUpColumn", selected.P2_BEMORD_ID); //campo da cui leggere la descrizione della search
      break;
    case "TKC_VI_GECOPE_L":
      model.set("TK_COSOPE_DESCRIPTION", selected.TK_COSOPE_DESCRIPTION);
      break;
  }

  let columnDescriptionSource;
  let columnDescriptionTarget;

  if (!grid?.options?.gridExtension?.searchgridInCellColumns) {
    return;
  }

  for (let element of grid?.options?.gridExtension?.searchgridInCellColumns) {
    if (element.Column === fieldinedit) {
      columnDescriptionSource = element.ColumnDescriptionSource;
      columnDescriptionTarget = element.ColumnDescriptionTarget;
    }
  }

  if (columnDescriptionSource) {
    model.set(columnDescriptionTarget, selected[columnDescriptionSource]);
  }
  return;
}

function downloadMaintenancereport(e, rep) {
  var grid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var selectedrow = $(e)
    .closest(".k-grid")
    .data("kendoGrid")
    .select();

  var report;
  var linkReport;
  if (grid.dataItem(selectedrow) == null) {
    kendoConsole.log("Selezionare almeno un elemento dalla griglia", true);
  } else if (rep == 3) {
    report = "libroImpianti/itea_libroimpianto";
    var typeAsset = grid.dataItem(selectedrow).PL_ASSET_PL_TIPASS_ID;
    var assetCode = grid.dataItem(selectedrow).PL_ASSET_CODE;

    linkReport =
      "/Helpers/downloadreport?report=" +
      report +
      "&pl_tipass_id={0}&pl_asset_code={1}&format=pdf&removeugvi=true";
    linkReport = linkReport.format(typeAsset.toString(), assetCode);
    $.fileDownload(linkReport);
  } else if (rep == 4) {
    report = "LibroImpianti_Clima/itea_libroimpianto";
    var typeAsset = grid.dataItem(selectedrow).PL_ASSET_PL_TIPASS_ID;
    var assetCode = grid.dataItem(selectedrow).PL_ASSET_CODE;

    linkReport =
      "/Helpers/downloadreport?report=" +
      report +
      "&pl_tipass_id={0}&pl_asset_code={1}&format=pdf&removeugvi=true";
    linkReport = linkReport.format(typeAsset.toString(), assetCode);
    $.fileDownload(linkReport);
  } else {
    var assetid = grid.dataItem(selectedrow).AS_ASSET_ID;
    report = rep == 1 ? "Piano_manutenzione" : "Manuale_manutenzione";

    linkReport =
      "/Helpers/downloadreport?report=" +
      report +
      "&as_asset_id={0}&format=pdf";
    linkReport = linkReport.format(assetid.toString());
    $.fileDownload(linkReport);
  }
}

function downloadlabels(e) {
  var grid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var selectedrow = $(e)
    .closest(".k-grid")
    .data("kendoGrid")
    .select();
  if (grid.dataItem(selectedrow) == null) {
    kendoConsole.log("Selezionare almeno un elemento dalla griglia", true);
  } else {
    var assetid = "";
    selectedrow.each(function(index, row) {
      assetid = assetid + grid.dataItem(row).DO_DOCUME_ID + ",";
    });
    assetid = assetid.slice(0, -1);
    //passo solo il nome del report perche' il path sara' costruito lato server sulla base delle configurazioni nel .config di Magic Framework (cartella configurations)
    var linkReport =
      "/Helpers/downloadreport?report=/etichette&DO_DOCUME_ID={0}&format=pdf";
    linkReport = linkReport.format(assetid.toString());
    $.fileDownload(linkReport);
  }
}

function removeFromFilter(filter, colname) {
  var filters = [];
  filters = $(filter.filters).map(function(i, v) {
    if (v.field != colname) return v;
  });
  filter.filters = filters;
}

function filterUnfilter(e, colname) {
  var jqgrid = $(e).closest(".k-grid");
  var kgrid = jqgrid.data("kendoGrid");
  var currfilter = kgrid.dataSource.filter() || {
    logic: "and",
    filters: [],
  };
  if (
    $(e)
      .html()
      .indexOf("k-i-funnel-clear") == -1
  ) {
    //remove filter
    removeFromFilter(currfilter, colname);
    //build new one
    if (currfilter.filters)
      currfilter.filters.push({
        field: colname,
        operator: "eq",
        value: true,
      });
    else
      currfilter = {
        field: colname,
        operator: "eq",
        value: true,
      };
    kgrid.dataSource.filter(currfilter);
    //turn it into expand
    $(e).html(
      '<span class="k-icon k-i-funnel-clear"></span>' + getObjectText("showall")
    );
  } else {
    //remove filter
    removeFromFilter(currfilter, colname);
    kgrid.dataSource.filter(currfilter);
    $(e).html(
      '<span class="k-icon k-i-funnel"></span>' + getObjectText("showlinked")
    );
  }
}

function selectAllVisibleRows(el, columnName, uncheck) {
  var value = !uncheck;
  var $grid = $(el).closest(".k-grid");
  var kendoGrid = $grid.data("kendoGrid");
  $.each(kendoGrid.dataSource.view(), function(k, v) {
    v[columnName] = value;
    v.dirty = true;
  });
  kendoGrid.refresh();
}

function selectAllRows(el, columnName, uncheck) {
  var value = !uncheck;
  var $grid = $(el).closest(".k-grid");
  var kendoGrid = $grid.data("kendoGrid");
  $.each(getFilteredDataFromKendoGrid(kendoGrid), function(k, v) {
    v.set(columnName, value);
  });
  kendoGrid.refresh();
}

function areConstraintsEnabled($grid) {
  return $grid.data("constraint_enabled");
}
//in cell edit constraints management (called after modification of cells)
function manageStageInCellConstraints(
  item,
  gridcode,
  gridentity,
  onChangeField,
  action
) {
  var deferred = $.Deferred();
  if (!(action == "remove" || action == "add" || action == "itemchange")) {
    deferred.resolve();
    return deferred.promise();
  }

  var kgrid = $("tr[data-uid=" + item.uid + "]")
    .closest(".k-grid")
    .data("kendoGrid");
  if (!kgrid) {
    kgrid = $(`div[gridname='${gridcode}']`).data("kendoGrid");
  }
  //wait for constraints check to be over (if pending) https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/235
  gridWaitForConstraintCall(gridcode).then(() => {
    //if constraints are not defined avoid calling db
    let constraintsEnabled = areConstraintsEnabled(kgrid.element);
    if (!constraintsEnabled) {
      deferred.resolve();
      return deferred.promise();
    }

    if (
      kgrid?.options?.gridExtension?.noconstraint_incell_columns?.filter(
        (e) => e.Column === onChangeField
      ).length > 0
    ) {
      deferred.resolve();
      return deferred.promise();
    }
    //debugger;
    var data = Object.assign({}, item);
    var stageid = null;

    for (var prop in data) {
      //se e' il campo di stage
      if (data.hasOwnProperty(prop) && prop.indexOf("EV_STAGE_ID") !== -1) {
        stageid = data[prop];
        break;
      }
      if (data.hasOwnProperty(prop) && data[prop] instanceof Date) {
        let date = new Date(data[prop].getTime());
        data[prop] = toTimeZoneLessString(date);
      }
    }
    //ask the DB for value changes
    var ds = buildXMLStoredProcedureJSONDataSource(
      {
        stageid: stageid,
        gridname: gridcode,
        gridentity: gridentity,
        data: data,
        onChangeField: onChangeField,
        incellaction: action,
      },
      function(fields) {
        $(fields.items).each(function(i, v) {
          //IDEARE and standard name field
          var value = v.EV_DEFAULT_VALUE || v.defaultvalue;
          let hidden = v.EV_STACOL_B_HIDDEN;
          let editable = v.EV_STACOL_B_EDITABLE;

          if (hidden === false || hidden === true) {
            if (hidden) kgrid.hideColumn(v.ColumnName);
            else kgrid.showColumn(v.ColumnName);
          }

          //Feature #7137 - Constraint editable per griglie con edit Inline

          if (editable === true || editable === false) {
            if (kgrid && kgrid.options && kgrid.options.editable) {
              if (kgrid && kgrid.options && kgrid.options.editable) {
                let model = kgrid.dataSource.at(0);
                if (
                  model &&
                  (editable === true || editable === false) &&
                  model.fields[v.ColumnName].editable !== editable
                )
                  model.fields[v.ColumnName].editable = editable;
              }
            }
          }

          var fieldDef =
            kgrid &&
            kgrid.options &&
            kgrid.options.dataSource &&
            kgrid.options.dataSource.schema &&
            kgrid.options.dataSource.schema.model &&
            kgrid.options.dataSource.schema.model.fields
              ? kgrid.options.dataSource.schema.model.fields[v.ColumnName]
              : null;

          //Bug #363 (gitlab) The constraints keeps running when value of field is changed
          if (value !== undefined) {
            if (fieldDef && fieldDef.type == "number") {
              var parse_fn =
                fieldDef.databasetype == "int" ? parseInt : parseFloat;
              var anumber = !value ? null : parse_fn(value.replace(",", "."));

              //added check to see if the value of the field changed
              if (anumber != item[v.ColumnName]) {
                //Bug #6688 - se non è editabile la set non funziona... allora faccio l' assegnazione "manuale" (che però non scatenerà eventuali change events a differenza di set...)
                //Bug #365 (gitlab) - aggiunto editable !== false. Verifica in più che il valore editable passato dal constraint sia non false (colonna non editable)

                if (
                  fieldDef.editable &&
                  editable !== false &&
                  typeof item.set === "function"
                )
                  item.set(v.ColumnName, anumber);
                else {
                  item[v.ColumnName] = anumber;
                  item.dirty = true;
                  if (typeof item.trigger == "function") item.trigger("change");
                }
              }
            }
            //not defined as a number...
            else {
              item[v.ColumnName] = value;
              item.dirty = true;
            }
          }
        });
        deferred.resolve(fields);
      },
      "core.usp_ev_ret_grid_contraints"
    );
    ds.read();
  });

  return deferred.promise();
}

function onChangeFieldmanageStageConstraints(e, fname, myGrid, model) {
  var $grid = myGrid;
  var gridname = $grid.first().attr("gridname");
  //wait for constraints check to be over (if pending) https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/235
  gridWaitForConstraintCall(gridname).then(() => {
    let constraintsEnabled = areConstraintsEnabled($grid);
    if (!constraintsEnabled) return;

    var entityname = $grid.first().attr("entityname");
    var tr = $(
      "tr[data-uid=" +
        $(e.container[0])
          .parent()
          .data("uid") +
        "]"
    );
    model = model || $grid.data("kendoGrid").dataItem(tr);
    var par = {
      model: model,
      container: e.container,
    };
    if (
      $(e).attr("name") &&
      $(e).data("role") &&
      $(e)
        .data("role")
        .indexOf("textbox") != -1
    )
      if ($(e).attr("data-role") == "numerictextbox") {
        //prob. per un problema di timing dell' evento il valore e' ancora quello vecchio in alcuni casi...
        par.model[$(e).attr("name")] = $(e)
          .val()
          .replace(",", ".");
      } else {
        par.model[$(e).attr("name")] = $(e).val();
      }

    if (fname && e.sender && typeof e.sender.value == "function") {
      par.model[fname] = e.sender.value();
    }
    //if the changed field is a drop fname (field name) is passed from the outer Js function. Default is the name attribute of the input.
    manageStageConstraints(
      par,
      gridname,
      entityname,
      fname ? fname : $(e).attr("name")
    );
  });
}

function manageStageConstraints(
    e,
    gridcode,
    gridentity,
    onChangeField,
    isSchemaFormGrid = false
) {
    var defer = $.Deferred();
    var data = JSON.parse(JSON.stringify(e.model.toJSON())); //D.T 10/03/2025 don't work on the original object 

    window.gridineditdatasourcemodel = e.model;
    var stageid = null;
    for (var prop in data) {
        //se e' il campo di stage
        if (data.hasOwnProperty(prop) && prop.indexOf("EV_STAGE_ID") !== -1) {
            stageid = data[prop];
            break;
        }

        if (
            data.hasOwnProperty(prop) &&
            data[prop] instanceof Date &&
            !isSchemaFormGrid
        ) {
            data[prop] = toTimeZoneLessString(data[prop]);
        }
    }
    var kGrid = e.sender;

    let extendedObj = {};
    //if the grid is inside a wizard, the model of the wizard is also sent to the SP
    if (kGrid && getWizardScope(kGrid.magicFormScope)) {
        var wholeModel = getWizardScope(kGrid.magicFormScope).models;
        extendedObj = $.extend(extendedObj, data, wholeModel);
    }

    let hasKeys = Object.keys(extendedObj).length;
    //chiedo al DB quali siano i vincoli per lo stage trovato
    var ds = buildXMLStoredProcedureJSONDataSource(
        {
            stageid: stageid,
            gridname: gridcode,
            gridentity: gridentity,
            data: hasKeys ? extendedObj : data,
            onChangeField: onChangeField,
        },
        function (res) {
            $(res.items).each(function (i, v) {
                detectWidgetTypeAndOverrideBehaviour(
                    v.ColumnName,
                    v.EV_STACOL_B_REQUIRED,
                    v.EV_STACOL_B_EDITABLE,
                    v.EV_DEFAULT_VALUE,
                    v.EV_STACOL_B_HIDDEN,
                    v.DetailDOMID,
                    e,
                    v.label
                );
            });
            defer.resolve(res.items);
        },
        "core.usp_ev_ret_grid_contraints"
    );
    ds.transport.async = false;
    ds.read();
    return defer.promise();
}

function splitextensions(ext) {
  var valids = ext.split("@");
  var out = "";
  for (var i = 1; valids.length(); i++) {
    out += valids[i] + ";";
  }
  return out;
}

function downloadfiles(e) {
  e.preventDefault();
  var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
  var obj = {
    DO_DOCUME_ID: 0,
  };
  if (dataItem.DO_DOCUME_ID != null) {
    obj.DO_DOCUME_ID = dataItem.DO_DOCUME_ID;
  } else if (dataItem.DO_DOCREL_DO_DOCUME_ID != null) {
    obj.DO_DOCUME_ID = dataItem.DO_DOCREL_DO_DOCUME_ID;
  }
  $.fileDownload("/api/Documentale/ExportzipforDocument/", {
    data: obj,
    httpMethod: "POST",
  });
}
function viewfile(e) {
    e.preventDefault();

    var jsonpayload = {};
    var pdfViewerController = $("#pdf-viewer-controller");
    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

    // Try to get jsonpayload configuration (like viewerPDF does)
    try {
        jsonpayload = getRowJSONPayload(e);
        if (jsonpayload && typeof getRowDataFromButton === 'function') {
            jsonpayload.rowData = getRowDataFromButton(e);
        } else {
            jsonpayload.rowData = dataItem;
        }
    } catch (ex) {
        // If no jsonpayload configuration exists, create a simple one
        jsonpayload = {
            rowData: dataItem
        };
    }

    // Extract file information from dataItem
    var fileDataString = dataItem.DO_DOCVER_LINK_FILE || "";
    var documentId = dataItem.DO_DOCFIL_DO_DOCUME_ID;

    // Check if empty values
    if (jQuery.isEmptyObject(fileDataString) || !documentId) {
        kendoConsole.log(
            'Configurazione errata: mancano DO_DOCVER_LINK_FILE o DO_DOCFIL_DO_DOCUME_ID',
            true
        );
        return;
    }

    // Parse the JSON string to extract file information
    var fileData;
    var fileName = "";
    var fileExt = "";

    try {
        fileData = JSON.parse(fileDataString);
        if (Array.isArray(fileData) && fileData.length > 0) {
            fileName = fileData[0].name || "";
            fileExt = fileData[0].ext || "";
        }
    } catch (ex) {
        kendoConsole.log("Errore nel parsing del file JSON: " + ex.message, true);
        return;
    }

    if (jQuery.isEmptyObject(fileName)) {
        kendoConsole.log('Nome file non trovato nel JSON', true);
        return;
    }

    // Check if it's a PDF file
    var isPdf = fileExt.toLowerCase() === ".pdf";

    if (!isPdf) {
        // If not PDF, download the file as before
        var obj = {
            DO_DOCFIL_DO_DOCUME_ID: documentId,
            DO_DOCVER_LINK_FILE: fileDataString,
        };
        $.fileDownload("/api/Documentale/ViewFile/", {
            data: obj,
            httpMethod: "POST",
        });
        return;
    }

    // If it's a PDF, open the PDF viewer using the same logic as viewerPDF
    var fileUrl = new $.Deferred();
    var reftreeServiceCode = jsonpayload.reftreeServiceCode ? jsonpayload.reftreeServiceCode : "";
    var gridParent = $(e.currentTarget).closest(".k-grid").parents(".k-grid").attr("gridName");

    // Check if reftreeServiceCode is configured (like viewerPDF does)
    if (jsonpayload.reftreeServiceCode) {
        // Only call StartServiceFromModel if reftreeServiceCode is present
        var data = {
            dataRow: dataItem,
            reftreeServiceCode: reftreeServiceCode,
            gridParent: gridParent
        };

        StartServiceFromModel(JSON.stringify(data)).then(
            function (res) {
                // Success - resolve with the response path
                fileUrl.resolve(res.Response);
            },
            function (err) {
                // Error - fallback to default path
                kendoConsole.log("Errore nel servizio, uso percorso predefinito", false);
                // Fallback: use a default path structure or the filename
                fileUrl.resolve(fileName);
            }
        );
    } else {
        // No reftreeServiceCode configured, call the stored procedure to get the full path
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api
                .get({
                    storedProcedureName: "core.usp_get_Document_path",
                    data: {
                        DO_DOCFIL_DO_DOCUME_ID: documentId,
                        DO_DOCVER_LINK_FILE: fileDataString,
                    },
                })
                .then(
                    function (response) {
                        // Extract document_path from the response
                        var documentPath = "";

                        try {
                            if (response && response[0] && response[0][0] && response[0][0].document_path) {
                                documentPath = response[0][0].document_path;
                            }
                        } catch (ex) {
                            kendoConsole.log("Errore nell'estrazione del percorso: " + ex.message, false);
                        }

                        // Combine path with filename
                        var fullPath = documentPath;
                        if (fullPath && !fullPath.endsWith('\\')) {
                            fullPath += '\\';
                        }
                        fullPath += fileName;

                        fileUrl.resolve(fullPath);
                    },
                    function (error) {
                        // Error - fallback to default filename
                        //kendoConsole.log("Errore nel recupero del percorso file, uso nome predefinito", false);
                        fileUrl.resolve(fileName);
                    }
                );
        });
    }
    $.when(fileUrl).then(function (res) {
        if (res == "" || !res) {
            return kendoConsole.log("Nessun file elaborato", true);
        }

        var config = {
            patFile: "",
            nomeFile: fileName,
            pathFileComplete: res,
            rowData: dataItem,
            reftreeServiceCode: reftreeServiceCode,
            downloadNotPdf: false,
            ready: function () {
                var interval = setInterval(function () {
                    var fadeout = pdfViewerController.find(".fadeout");
                    if (fadeout.length > 0) {
                        clearInterval(interval);
                        $("#pdf-viewer-controller-spinner").remove();
                        fadeout.addClass("fadein");
                    }
                }, 100);
            },
            close: function (e) {
                $("#idPdfViewer")
                    .find("#btnExit")
                    .click();
            },
        };

        pdfViewerController = $('<div id="pdf-viewer-controller">')
            .append($(getAngularControllerElement("pdfViewerController", config)).addClass("fadeout"));
        pdfViewerController.append(
            '<div id="pdf-viewer-controller-spinner" style="position: absolute; left: 50%; top: 40%">' +
            largeSpinnerHTML +
            "</div>"
        );

    }, function (err) {
        console.log(err);
        kendoConsole.log("Errore nell'apertura del visualizzatore PDF", true);
    });
}
function createModelDoc(supregId, refereID, tipmodCode) {
  var rowdata = { SR_SUPREG_ID: supregId, SR_SUPREG_LE_REFERE_ID: refereID };
  var settings = { actioncommand: tipmodCode };
  var subsettings = null;
  var tipmodcode = settings.actioncommand; //TipMod Code

  $.ajax({
    //#mfapireplaced
    type: "POST",
    url: "/api/MF_API/GetTypeModel",
    data: JSON.stringify({
      PS_TIPMOD_CODE: settings.actioncommand,
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    error: function(err) {
      console.log(err.responseText);
    },
  }).then(
    function(res) {
      var typeModelData = res.Data[0].Table[0];
      var tipmod = {
        id: typeModelData.PS_TIPMOD_ID,
        code: typeModelData.PS_TIPMOD_CODE,
        description: typeModelData.PS_TIPMOD_DESCRIPTION,
        batch: typeModelData.PS_TIPMOD_FLAG_BATCH,
        tipoutId: typeModelData.PS_TIPMOD_PS_TIPOUT_ID,
        tipoutCode: typeModelData.PS_TIPOUT_CODE,
        tipoutDescription: typeModelData.PS_TIPOUT_DESCRIPTION,
      };
      //disparchers of reftree...
      buildDocuments(
        null,
        tipmod,
        [rowdata],
        function() {
          //window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataSource.read();
          refreshTotalsGrid();
          if (typeof target != "undefined")
            manageSubActionsOnActionEnd(target, settings, subsettings);
        },
        null,
        "Documentale",
        $("div[gridname='SR_DOCUME_UPLOADED']").data("kendoGrid")
      );
    },
    function(res) {
      console.log(res);
    }
  );
}

function viewModelDoc(docID, linkFile) {
  var file =
    '[{"name":"' +
    linkFile[0].name +
    '","ext":"' +
    linkFile[0].ext +
    '","size":' +
    linkFile[0].size +
    "}]";
  var obj = {
    DO_DOCFIL_DO_DOCUME_ID: docID,
    DO_DOCVER_LINK_FILE: file,
  };
  //  obj.DO_DOCFIL_DO_DOCUME_ID = dataItem.DO_DOCFIL_DO_DOCUME_ID;
  //  obj.DO_DOCVER_LINK_FILE = dataItem.DO_DOCVER_LINK_FILE;
  $.fileDownload("/api/Documentale/ViewFile/", {
    data: obj,
    httpMethod: "POST",
  });
}

function showImagesGallery(e) {
  e.preventDefault();
  var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
  //creo i thumbnails (se non ci sono) e a fine operazione mostro il gallery
  var thumbcreated = new $.Deferred();
  $.getJSON("api/Documentale/CreateThumbs/" + dataItem.DO_DOCUME_ID, function(
    data
  ) {
    thumbcreated.resolve();
  });
  $.when(thumbcreated).then(function() {
    require([
      window.includesVersion + "/Custom/3/Scripts/config.js",
    ], function() {
      require(["imagesdocmng"], function() {
        showGallery(dataItem);
      });
    });
  });
}

function createThumbsForAsset(assetid) {
  var thumbcreated = new $.Deferred();
  doModal(true);
  $.getJSON("api/Documentale/CreateAssetThumbs/" + assetid, function(data) {
    doModal(false);
    thumbcreated.resolve();
  }).error(function(message) {
    doModal(false);
    console.log(message);
  });
  return thumbcreated.promise();
}

function showAssetImagesGallery(e) {
  var entityGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var row = entityGrid.select();
  var dataItem = entityGrid.dataItem(row);
  if (dataItem == null) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }

  if (dataItem.HasImage != true) {
    kendoConsole.log(getObjectText("assetnoimg"), true);
    return;
  }
  //creo i thumbnails (se non ci sono) e a fine operazione mostro il gallery
  $.when(createThumbsForAsset(dataItem.AS_ASSET_ID)).then(function() {
    require([
      window.includesVersion + "/Custom/3/Scripts/config.js",
    ], function() {
      require(["imagesdocmng"], function() {
        showAssetGallery(dataItem);
      });
    });
  });
  //var thumbcreated = new $.Deferred;
  //doModal(true);
  //$.getJSON("api/Documentale/CreateAssetThumbs/" + dataItem.AS_ASSET_ID, function (data) {
  //    doModal(false);
  //    thumbcreated.resolve();
  //});
  //$.when(thumbcreated).then(function () {
  //    require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
  //        require(["imagesdocmng"],
  //            function () {
  //                showAssetGallery(dataItem);
  //            });
  //    });
  //});
}

//#endregion
function refreshv_us_magicgrids(e) {
  if ($("[gridname=V_US_MAGICGRIDS_griglie]").data("kendoGrid") !== undefined)
    $("[gridname=V_US_MAGICGRIDS_griglie]")
      .data("kendoGrid")
      .dataSource.read();
}

function refreshv_us_magicfunctions(e) {
  if ($("[gridname=V_US_MAGICFUNCTIONS]").data("kendoGrid") !== undefined)
    $("[gridname=V_US_MAGICFUNCTIONS]")
      .data("kendoGrid")
      .dataSource.read();
}

function bindproaredrop(e) {
  for (i = 0; i < e.sender._data.length; i++) {
    // remove  assign if job is already assigned or started, or have not rights
    if (
      e.sender._data[i].JO_ANAPRO_JO_PROARE_ID != 0 ||
      e.sender._data[i].JO_JOBANA_START_DATE != null ||
      e.sender._data[i].FLAG_ASSIGN === 0
    ) {
      $("tr[data-uid='" + e.sender._data[i].uid + "']")
        .find(".k-grid-Assign")
        .remove();
    }
    // remove start if job is not assigned, already started, or have not rights
    if (
      e.sender._data[i].JO_JOBANA_START_DATE != null ||
      e.sender._data[i].JO_ANAPRO_JO_PROARE_ID === 0 ||
      e.sender._data[i].FLAG_START === 0
    ) {
      $("tr[data-uid='" + e.sender._data[i].uid + "']")
        .find(".k-grid-Start")
        .remove();
    }
    // remove start if previous job is not finished or error
    if (i > 0) {
      if (
        e.sender._data[i - 1].JO_JOBANA_END_DATE === null ||
        e.sender._data[i - 1].JO_JOBANA_ERROR != null
      ) {
        $("tr[data-uid='" + e.sender._data[i].uid + "']")
          .find(".k-grid-Start")
          .remove();
      }
    }

    //if (e.sender._data[0].JO_JOBANA_END_DATE === null)
    //{
    //    //remove button if end_data is empty
    //    $(e.sender.element[0]).find(".k-grid-Next").remove();
    //}
  }
}

//#region assetmanager

//#region maintenancereport
//TODO: provvisorio per la demo del 20!!!!!
function customDirlogic(e) {
  if (e.FP_DFAULT_FP_FDFAUL_ID == 7) return "Immagini_Degradi/da_bibliografia/";
  else return "Immagini_Degradi/da_norme_o_da_casi_studio/";
}

function unpackPictureLink(e, filenameonly) {
  //var relpath = 'F:/Ref3Files/DevCei/';
  ////'/Views/Images/';
  //var variablepath = customDirlogic(e);
  //relpath = relpath + variablepath;
  //try {

  //    var o = JSON.parse(e.FP_DFAULT_FILE)[0];
  //    if (filenameonly)
  //        //return relpath + o.name.split('-')[1];
  //        return relpath + o.name;
  //    // return '<img height="50" src="' + relpath + o.name.split('-')[1] + '"/>';
  //    return '<img height="50" src="' + relpath + o.name+ '"/>';
  //}
  //catch (err) {
  //    console.log("uploaded file definition format is illegal")
  //}
  //if (filenameonly)
  //    return relpath + e.FP_DFAULT_FILE;
  //return '<img height="50" src="' + relpath + e.FP_DFAULT_FILE + '"/>';
  return e.FP_DFAULT_FILE; //LA 07/02/2017 CHIEDERE A DARIO
}

function faultReport(e) {
  return (
    "<a href='javascript:faultReportLoadHtml(" +
    e.FP_TFAULT_ID +
    ")'>" +
    e.FP_TFAULT_DESCRIPTION +
    "</a>"
  );
}

function faultReportLoadHtml(FP_TFAULT_ID) {
  doModal(true);
  var FP_TFAULT_CODE = "";
  var FP_TFAULT_DESCRIPTION = "";
  var FP_TFAULT_NAME = "";
  var FP_SRCFLT_DESCRIPTION = "";

  function createrepo() {
    var labfor = "<h5>{0}</h5>";

    $("#FP_TFAULT_CODE").html(labfor.format(FP_TFAULT_CODE));
    $("#FP_TFAULT_DESCRIPTION").html(labfor.format(FP_TFAULT_DESCRIPTION));
    $("#FP_TFAULT_NAME").html(labfor.format(FP_TFAULT_NAME));
    $("#FP_SRCFLT_DESCRIPTION").html(labfor.format(FP_SRCFLT_DESCRIPTION));
    if (filesoffault.length > 0) {
      var dataSource = new kendo.data.DataSource({
        data: filesoffault,
        pageSize: 5,
      });

      $("#pager").kendoPager({
        dataSource: dataSource,
      });
      $("#listView").kendoListView({
        dataSource: dataSource,
        template: kendo.template($("#template").html()),
      });
    }
    if (filesoffaultbib.length > 0) {
      var datasource2 = new kendo.data.DataSource({
        data: filesoffaultbib,
        pageSize: 5,
      });

      $("#pager2").kendoPager({
        dataSource: datasource2,
      });
      $("#listView2").kendoListView({
        dataSource: datasource2,
        template: kendo.template($("#template").html()),
      });
    }
    if (materials.length > 0) {
      var dataSource = new kendo.data.DataSource({
        data: materials,
      });
      $("#listViewmat").kendoListView({
        dataSource: dataSource,
        template: kendo.template($("#mattemplate").html()),
      });
    }
    if (causes.length > 0) {
      var dataSource = new kendo.data.DataSource({
        data: causes,
      });
      $("#listViewcauses").kendoListView({
        dataSource: dataSource,
        template: kendo.template($("#cautemplate").html()),
      });
    }
  }
  //load dei files legati ad un TFAULT
  var materials = [],
    causes = [],
    filesoffault = [],
    filesoffaultbib = [];
  var materialloader = new $.Deferred();
  var causesloader = new $.Deferred();
  var docsloader = new $.Deferred();
  var faultloader = new $.Deferred();

  var api = "/api/MF_API/";
  var docsdata = {
    apiMethod: "GetFP_V_DFAULT",
    param: { FP_DFAULT_FP_TFAULT_ID: FP_TFAULT_ID },
    //table: 'core.FP_V_DFAULT',
    //order: 'FP_DFAULT_DESCRIPTION',
    //where: 'FP_DFAULT_FP_TFAULT_ID = ' + FP_TFAULT_ID
  };
  var matdata = {
    apiMethod: "GetFP_V_MATFAU",
    param: { FP_TFAULT_ID: FP_TFAULT_ID },
    //table: 'core.FP_V_MATFAU',
    //order: 'Checked DESC,FP_ELEMAT_DESCRIPTION',
    //where: 'FP_TFAULT_ID = ' + FP_TFAULT_ID
  };
  var caudata = {
    apiMethod: "GetFP_V_RELCAU",
    param: { FP_RELCAU_FP_TFAULT_ID: FP_TFAULT_ID },
    //table: 'core.FP_V_RELCAU',
    //order: 'FP_CAUFAU_DESCRIPTION',
    //where: 'FP_RELCAU_FP_TFAULT_ID = ' + FP_TFAULT_ID
  };
  var faudata = {
    apiMethod: "GetFP_V_TFAULT",
    param: { FP_TFAULT_ID: FP_TFAULT_ID },
    //table: 'core.FP_V_TFAULT',
    //order: 'FP_TFAULT_DESCRIPTION',
    //where: 'FP_TFAULT_ID = ' + FP_TFAULT_ID
  };

  var fausuccess = function(result) {
    var data = result.Data[0].Table[0];
    FP_TFAULT_CODE = data.FP_TFAULT_CODE;
    FP_TFAULT_DESCRIPTION = data.FP_TFAULT_DESCRIPTION;
    FP_TFAULT_NAME = data.FP_TFAULT_NAME;
    FP_SRCFLT_DESCRIPTION = data.FP_SRCFLT_DESCRIPTION;
    faultloader.resolve();
  };

  var docsuccess = function(result) {
    if (result.Count > 0 && result.Data) {
      filesoffault = $(result.Data[0].Table).map(function(i, v) {
        if (v.FP_FDFAUL_CODE == "1") {
          v.FP_DFAULT_FILE = unpackPictureLink(v, true);
          return v;
        }
      });
      filesoffaultbib = $(result.Data[0].Table).map(function(i, v) {
        if (v.FP_FDFAUL_CODE == "2") {
          v.FP_DFAULT_FILE = unpackPictureLink(v, true);
          return v;
        }
      });
    }
    docsloader.resolve();
  };
  var matsuccess = function(result) {
    if (result.Count > 0 && result.Data) {
      materials = $(result.Data[0].Table).map(function(i, v) {
        if (v.Checked) return v;
      });
    }
    materialloader.resolve();
  };
  var causuccess = function(result) {
    if (result.Count > 0 && result.Data) {
      causes = result.Data[0].Table;
    }
    causesloader.resolve();
  };

  function ajaxerror() {
    doModal(false);
  }
  $.ajax({
    //#mfapireplaced
    url: api + docsdata.apiMethod,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(docsdata.param),
    error: ajaxerror,
    success: docsuccess,
    dataType: "json",
  });
  $.ajax({
    //#mfapireplaced
    url: api + matdata.apiMethod,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(matdata.param),
    error: ajaxerror,
    success: matsuccess,
    dataType: "json",
  });
  $.ajax({
    //#mfapireplaced
    url: api + caudata.apiMethod,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(caudata.param),
    error: ajaxerror,
    success: causuccess,
    dataType: "json",
  });
  $.ajax({
    //#mfapireplaced
    url: api + faudata.apiMethod,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(faudata.param),
    error: ajaxerror,
    success: fausuccess,
    dataType: "json",
  });
  $.when(docsloader, causesloader, materialloader, faultloader).then(
    function() {
      doModal(false);
      $(".modal-title").text(getObjectText("faultreport"));
      $("#contentofmodal").empty();
      $("#contentofmodal").append('<div id="faultreportcontent"></div>');
      $("#executesave").unbind("click");
      $("#executesave").hide();
      $("#wndmodalContainer").modal("toggle");
      $("#faultreportcontent").load(
        "/Views/3/Templates/AST_Maintenance_fault_repo.html",
        createrepo
      );
    }
  );

  //Load dei materiali
}
//#endregion
//gestione degli altri indirizzi
function assetAddressTemplate(e) {
  return (
    "<a href='javascript:geoModalAsset(\"" +
    e.AS_ASSET_ADDRESS +
    "\")'>" +
    e.AS_ASSET_ADDRESS +
    "</a>"
  );
}

function buildFKAutocompleteEditorOtherAddresses(
  column,
  tablename,
  valuefield,
  textfield
) {
  var field = column.field;

  column.template = column.template = function(dataItem) {
    return dataItem.Location_DESCRIPTION === null
      ? "N/A"
      : dataItem.Location_DESCRIPTION;
  };

  column.editor = function(container, options) {
    // use an autocomplete as an editor
    var ds = new kendo.data.DataSource({
      transport: {
        read: {
          url: "/api/ManageFK/GetDropdownValues",
          serverFiltering: true,
          data: {
            tablename: tablename,
            valuefield: valuefield,
            textfield: textfield,
          },
          contentType: "application/json; charset=utf-8",
          type: "POST",
          dataType: "json",
        },
        parameterMap: function(options, operation) {
          return kendo.stringify(options);
        },
      },
      schema: {
        parse: function(data) {
          data.unshift({
            value: "0",
            text: "N/A",
          });
          return data;
        },
      },
    });
    var model = options.model;
    $("<input/>")
      .appendTo(container)
      .kendoAutoComplete({
        placeholder: "componi indirizzo...",
        filter: "contains",
        dataTextField: "text",
        dataValueField: "value",
        minLength: 1,
        dataSource: ds,
        change: function(e) {
          var streets = $(e.sender.element)
            .data("kendoAutoComplete")
            .dataSource.view();
          var chosen = $(e.sender.element)
            .data("kendoAutoComplete")
            .value();
          var value = 0;
          for (k = 0; k < streets.length; k++) {
            if (streets[k].text === chosen) {
              value = streets[k].value;
              break;
            }
          }

          model.set("LOCATION_STREET_ID", value);
          model.set("Location_DESCRIPTION", chosen);
        },
      });
  };
}
//funzione di render del template della colonna AS_ASSET_ADDRESS
function solveAddress(e) {
  if (e.AS_ASSET_ADDRESS !== null && e.AS_ASSET_ADDRESS !== "") {
    var addressobj = JSON.parse(e.AS_ASSET_ADDRESS);
    return (
      "<span>" +
      addressobj.STREET_NAME +
      " " +
      addressobj.LOCATION_NUMBER +
      ", " +
      addressobj.LOCALITY_NAME +
      " (" +
      addressobj.NATION_CODE +
      ")</span><br><span><b>LAT::</b>" +
      addressobj.STREET_LATITUDE +
      ",<b>LONG::</b>" +
      addressobj.STREET_LONGITUDE +
      "</span>"
    );
  } else return "<span>N/A</span>";
}

//scarico mappe static google

function downloadStaticGmaps(e) {
  var html =
    '<div class="col-md-12"><label for="height___">Height</label><input id="height___" value="300"/><label for="width___">Width</label><input id="width___" value="300"/><label for="zoom___">Zoom</label><input id="zoom___" value="16"/></div><br/><button style="margin-left:15px;" id="gstaticdownload">OK</button>';
  cleanModal();
  var $content = showModal({
    title: "Download static gmap",
    content: html,
  });

  var selectedrows = $(e)
    .closest(".k-grid")
    .data("kendoGrid")
    .select();
  if (!selectedrows.length) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }
  //aggiunge ai dati di riga il payload impostato dall utente
  //var datapayload = [];

  $content.find("#gstaticdownload").click(function() {
    var datapayload = [];

    for (var i = 0; i < selectedrows.length; i++)
      datapayload.push(
        $.extend(
          $(e)
            .closest(".k-grid")
            .data("kendoGrid")
            .dataItem(selectedrows[i]),
          {
            height: $content.find("#height___").val(),
            width: $content.find("#width___").val(),
            zoom: $content.find("#zoom___").val(),
          }
        )
      );

    $.ajax({
      type: "POST",
      url: "/api/AS_V_LOCATION_locationextended/DownloadStaticMaps/",
      data: JSON.stringify(datapayload),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(result) {
        kendoConsole.log("Images created", false);
        $(e)
          .closest(".k-grid")
          .data("kendoGrid")
          .dataSource.read();
        hideModal();
      },
      error: function(message) {
        kendoConsole.log(message.responseText, true);
      },
    });
  });
}

//#endregion
//#region Sister
function exportCSVToSister(e) {
  function sanitizeCSV(separator, value) {
    if (
      value &&
      typeof value.indexOf == "function" &&
      value.indexOf(separator) != -1
    )
      value = '"' + value + '"';
    return value;
  }
  var grid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var elementsInGrid = grid.dataSource.data();
  var cols = {};
  $.each(grid.columns, function(i, v) {
    if (v.field && v.field != "checked") cols[v.field] = true;
  });
  var separator = ";";
  var csvcontent = "";
  var header = [];
  var values = [];

  //a) codice belfiore
  //b) partita IVA
  //c) tipo catasto (terreni o fabbricati)
  //d) foglio
  //e) mappale
  //f) subalterno
  var colsArray = [0, 0, 0, 0, 0, 0];
  var sisteridx = {
    CODICE_BELFIORE: 0,
    Partita_iva: 1,
    AS_TIPCAT_CODICE: 2,
    AS_IDECAT_FOGLIO: 3,
    AS_IDECAT_NUMERO: 4,
    AS_IDECAT_SUBALTERNO: 5,
  };
  $.each(elementsInGrid, function(i, v) {
    if (v.checked) {
      var j = 0;
      $.each(v, function(key, value) {
        if (cols[key] == true) {
          //        header.push(key);
          if (sisteridx[key]) colsArray[sisteridx[key]] = j;
          j++;
        }
      });
      //     csvcontent += header.join(separator) + "\n";
      return false; //break at 1st
    }
  });
  //composition of csv as string comma separated
  $.each(elementsInGrid, function(i, v) {
    if (v.checked) {
      $.each(v, function(key, value) {
        if (cols[key] == true) values.push(sanitizeCSV(separator, value));
      });
      csvcontent += values.join(separator) + "\n";
      values = [];
    }
  });
  if (!csvcontent) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }

  console.log(csvcontent);
  var exportobject = {
    selected: csvcontent,
    colsArray: colsArray.join(","),
  };

  $.ajax({
    type: "POST",
    url: "/api/AssetThemes/ExportIdeCatAndSendToSister/",
    data: JSON.stringify(exportobject),
    contentType: "application/json; charset=utf-8",
    //    dataType: "json",
    success: function(result) {
      kendoConsole.log(result.message, false);
      $(e)
        .closest(".k-grid")
        .data("kendoGrid")
        .dataSource.read();
    },
    error: function(message) {
      kendoConsole.log(message.responseText, true);
    },
  });
}

function editRefereClaref(e) {
  console.log(e);
}

function editUser(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  var oPsw = new $.Deferred();

  if (e.model.isNew()) {
    $.getJSON("/api/magic_mmb_users/randomPassword", function(data) {
      e.model.set("Password", data.Password);
      e.model.set("pHash", data.PasswordHash);
      oPsw.resolve();
    }).fail(function(jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
      console.log("Request Failed: " + err);
      oPsw.resolve();
    });
  }

  $.when(oPsw).then(function() {
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
  });
}

//#endregion
//#region edit Overrides
//#region docs
//aggiunge al popup dei documenti il settaggio per mostrare l' associazione a Business Object e la maschera di gestione dei layer in fase di insert
function editDocument(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");

  //if (!e.model.isNew())
  //    overrideAcceptedExtensions(e, e.model.DO_TIPDOC_EXTENSIONS);
  //else {
  //    var maingrid = e.sender.element;
  //    //Get row from uid of model, get master grid's row dataitem.
  //    var allowedext = maingrid.data("kendoGrid").dataItem($("#" + gridname).find("tr[data-uid='" + e.model.uid + "']").parents("tr").prev("tr")).DO_TIPDOC_EXTENSIONS;
  //    overrideAcceptedExtensions(e, allowedext);
  //}

  //In AdminAreaCustomizations.js c'e' la definizione dell' hash con il valore del flag foto per i nuovi elementi (per quelli esistenti non c'e' problema)
  var DO_CLADOC_FLAG_PHOTO =
    window.documentPhotoValueTrue[gridname] == null
      ? false
      : window.documentPhotoValueTrue[gridname];
  var assignedtipdoc = new $.Deferred();
  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          documentClass: {
            type: "string",
            title:
              gridname === "PPT_VI_DOCUMENTUM_FILE_NEW"
                ? "Famiglia documentale"
                : getObjectText("docclass"),
          },
          documentType: {
            type: "string",
            title:
              gridname === "PPT_VI_DOCUMENTUM_FILE_NEW"
                ? "Tipologia documentale"
                : getObjectText("doctype"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];
        //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/219  change from set to assignment in order to avoid the model to be set dirty if the field is not defined
        //e.model.set("DO_CLADOC_FLAG_PHOTO", DO_CLADOC_FLAG_PHOTO);
        e.model["DO_CLADOC_FLAG_PHOTO"] = DO_CLADOC_FLAG_PHOTO;
        var rowdata = e.model;
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "get_do_cladoc_for_user",
            schema: "core",
            textfield: "DO_CLADOC_DESCRIPTION",
            valuefield: "DO_CLADOC_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                classes.push({
                  DO_CLADOC_ID: parseInt(v.value),
                  text: v.text,
                  MagicBOLayer_ID: v.MagicBOLayer_ID,
                });
              });
              $.ajax({
                type: "POST",
                url: "/api/MANAGEFK/CallFKStoredProcedure",
                data: JSON.stringify({
                  storedprocedurename: "get_do_tipdoc_for_user",
                  schema: "core",
                  textfield: "DO_TIPDOC_DESCRIPTION",
                  valuefield: "DO_TIPDOC_ID",
                  rowdata: JSON.stringify(rowdata),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function(err) {
                  dataloader.resolve();
                },
                success: function(result) {
                  $.each(result, function(i, v) {
                    types.push({
                      value: v.DO_TIPDOC_ID,
                      text: v.DO_TIPDOC_DESCRIPTION,
                      DO_CLADOC_ID: v.DO_TIPDOC_DO_CLADOC_ID,
                      MagicBOLayer_ID: v.MagicBOLayer_ID,
                      DO_TIPDOC_DO_STADOC_ID: v.DO_TIPDOC_DO_STADOC_ID,
                    });
                  });
                  dataloader.resolve();
                },
              });
            } else {
              dataloader.resolve();
            }
          },
        });
        $.when(dataloader).then(function() {
          e.container
            .find("[name$=\\[documentClass\\]]")
            .attr("id", "parentdoc");
          e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "DO_CLADOC_ID",
            dataSource: {
              data: classes,
            },
          });
          e.container.find("[name$=\\[documentType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
            cascadeFrom: "parentdoc",
          });
          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=150px", //moves up
            });

          if (types.length > 0) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[documentClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[documentType\\]]")
                  .data("kendoDropDownList")
                  .value();
                var stadoc = btnwindow
                  .find("[name$=\\[documentType\\]]")
                  .data("kendoDropDownList")
                  .dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.DO_DOCUME_DO_TIPDOC_ID = parseInt(seltype);
                e.model.DO_TIPDOC_DO_CLADOC_ID = parseInt(selclass);
                if (stadoc) e.model.DO_DOCUME_DO_STADOC_ID = parseInt(stadoc);
                btnwindow
                  .find("input[name=DO_TIPDOC_DO_CLADOC_ID]")
                  .attr("disabled");
                btnwindow
                  .find("input[name=DO_DOCUME_DO_TIPDOC_ID]")
                  .attr("disabled");
                var closeValidationTooltip = function() {
                  btnwindow
                    .find("input[name=DO_DOCUME_DO_STADOC_ID]")
                    .closest("div")
                    .find(".k-widget .k-tooltip a")
                    .trigger("click");
                  btnwindow.find("div.k-tab-error-underline").remove();
                };
                assignedtipdoc.resolve(
                  e.model.DO_DOCUME_DO_TIPDOC_ID,
                  closeValidationTooltip
                );
              });
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  if (!e.model.isNew()) assignedtipdoc.resolve(e.model.DO_DOCUME_DO_TIPDOC_ID);
  else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }

  //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
  $.when(assignedtipdoc).then(function(tipdocid, closeValidationTooltip) {
    var selectDataBoundsPromises;
    var gridNoBo = [
      "FASC_DOCUMENTI",
      "RD_VI_DocumeSic_CEI",
      "VI_DOCUMENTI_SIC_STO",
      "PPT_VI_DOCUMENTUM_FILE_SON",
    ];
    if (
      e.model.DO_DOCREL_ID_RECORD !== null &&
      e.model.DO_DOCREL_ID_RECORD !== undefined
    )
      selectDataBounds = getStandardEditFunction(e, null, gridhtmlid);
    //lo appendo al fondo del 1o TAB
    else
      selectDataBounds = getStandardEditFunction(
        e,
        null,
        gridhtmlid,
        undefined,
        gridNoBo.indexOf(e.gridname) == -1 //la personalizzazione fascicolo fabbricato CEI x nascondere BO
          ? {
              appendTo: "#tabstrippopup-1",
              callback: function() {
                getBoTypeFilterFieldKey(tipdocid, "DO_DOCUME_DO_TIPDOC_ID"); //OBTIDO relazioni tra il tipo ed i business objects
                //D.T: aggiungo al BOSelector le informazioni sull'  entita' che e' in EDIT
                //

                setBOLinkedEntity("DO_V_DOCUME", tipdocid, e.model);
              },
            }
          : {}
      );
    $.when(selectDataBounds).then(function(selectDataBoundspromises) {
      $.when(selectDataBoundspromises["DO_DOCUME_DO_STADOC_ID"]).then(
        function() {
          if (
            closeValidationTooltip &&
            typeof closeValidationTooltip == "function"
          )
            closeValidationTooltip();
        }
      );
    });

    //Sovrascrivo le estensioni che sono accettate a livello di TIPDOC
    var docsdata = {
      //#mfapireplaced
      DO_TIPDOC_ID: "" + tipdocid,
    };
    $.ajax({
      url: "/api/MF_API/GetDO_TIPDOC_document_type",
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(docsdata),
      error: function(err) {
        console.log(err);
      },
      success: function(res) {
        var allowedextensions = res.Data[0].Table[0].DO_TIPDOC_EXTENSIONS;
        //$.ajaxoverrideAcceptedExtensions(e, allowedextensions);
        overrideAcceptedExtensions(e, allowedextensions);
      },
      dataType: "json",
    });
  });
}

//Test NM
function editTicketIns(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");

  var assignedservice = new $.Deferred();

  //Gestisco i lcomportamento differene in CREATE e in UPDATE
  if (!e.model.isNew()) {
    assignedservice.resolve(e.model.TK_TICKET_TK_SERVIC_ID);
  }
  //Comportamento in create
  else {
    //e.container.hide();
    //e.container.closest('.k-window').hide();
    //layerpreselect(e);
    assignedservice.resolve(e.model.TK_TICKET_TK_SERVIC_ID);
  }

  //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il SERVIC_ID
  $.when(assignedservice).then(function(servicId, closeValidationTooltip) {
    var selectDataBoundsPromises;
    if (
      e.model.DO_DOCREL_ID_RECORD !== null &&
      e.model.DO_DOCREL_ID_RECORD !== undefined
    )
      //VA MODIFICATO ASSOLUTAMETE!
      selectDataBounds = getStandardEditFunction(e, null, gridhtmlid);
    //lo appendo al fondo del 1o TAB
    else
      selectDataBounds = getStandardEditFunction(
        e,
        null,
        gridhtmlid,
        undefined,
        {
          appendTo: "#tabstrippopup-1",
          callback: function() {
            getBoTypeFilterFieldKey(servicId, "TK_TICKET_TK_SERVIC_ID"); //OBTIDO relazioni tra il tipo ed i business objects
            //D.T: aggiungo al BOSelector le informazioni sull'  entita' che e' in EDIT
            setBOLinkedEntity("TKG_TICKET_L", servicId);
            console.log("Passo in else");
          },
        }
      );
    /*Da risolvere
            $.when(selectDataBounds).then(function (selectDataBoundspromises) {
                $.when(selectDataBoundspromises["DO_DOCUME_DO_STADOC_ID"]).then(function () {
                    if (closeValidationTooltip && typeof closeValidationTooltip == 'function')
                        closeValidationTooltip();
                });
            });
            */

    /*Non dovrebe servire, TODO: replace with sql-injection-proof api call before uncommenting this block (ask felix)
            //Sovrascrivo le estensioni che sono accettate a livello di TIPDOC
            var docsdata = { table: "core.DO_TIPDOC_document_type", order: "DO_TIPDOC_DESCRIPTION", where: "DO_TIPDOC_ID = " + servicId };
            $.ajax({ url: "/api/GenericSQLCommand/GetWithFilter", type: "POST", contentType: "application/json; charset=utf-8", data: JSON.stringify(docsdata), 
                error: function (err) { console.log(err); }, 
                success: function (res)
                {  var allowedextensions = res.Data[0].Table[0].DO_TIPDOC_EXTENSIONS;
                overrideAcceptedExtensions(e, allowedextensions); }  , dataType: "json" });
                */
  });
}

function editDocFile(e) {
  var gridname = e.sender.element.attr("id");
  getStandardEditFunction(e, null, gridname);
  if (!e.model.isNew())
    overrideAcceptedExtensions(e, e.model.DO_TIPDOC_EXTENSIONS);
  else {
    var maingrid = e.sender.element.parents(".k-grid");
    //Get row from uid of model, get master grid's row dataitem.
    var allowedext = maingrid.data("kendoGrid").dataItem(
      $("#" + gridname)
        .find("tr[data-uid='" + e.model.uid + "']")
        .parents("tr")
        .prev("tr")
    ).DO_TIPDOC_EXTENSIONS;
    overrideAcceptedExtensions(e, allowedext);
  }
}

function overrideAcceptedExtensions(e, allowedextensions) {
  if (allowedextensions && allowedextensions != null) {
    allowedextensions = "." + allowedextensions.replace(/(\|)/g, ",.");
    e.container.find("input[type=file]").attr("accept", allowedextensions);
  } else e.container.find("input[type=file]").removeAttr("accept");
}
//#endregion
//#region asset
function editAssetStd(e) {
  //se sono in modifica elimino la scelta del gruppo di default
  //D.T: tolto su richiesta Luca 23/6/2017
  // if (e.model.id)
  //   $("input[name=DEFAULT_GROUP_ID]").closest("[class*=col-]").remove();
  getStandardEditFunction(e, null, "derivativeassetgrid", e.layerid); //e.layerid e' il layer considerato nel caso di insert
  //mostro l' immagine principale in fondo al 1o TAB
  if (e.model.Main_Image_Thumbnail != null) {
    var $last = $("#tabstrippopup-1 .row > *").last();
    $last.after(
      $last
        .clone()
        .html(
          "<div class='k-edit-field'><img src='" +
            e.model.Main_Image_Thumbnail +
            "'/></div>"
        )
    );
  }
}
//#endregion
//#region structures
function editStructure(e) {
  console.log("editStructure");
  var gridname = e.sender.element.attr("id");
  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          structureType: {
            type: "string",
            title: getObjectText("strtype"),
          },
        },
      },
    };

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        $("[data-schemaid=root]").css("width", "97%");
        $("div.form-group").css("max-width", "92%");

        var types = [];
        $.ajax({
          //#mfapireplaced
          type: "GET",
          async: false,
          url: manageAsyncCallsUrl(
            false,
            "/api/MF_API/GetAS_TIPSTR_type_structure"
          ),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function(result) {
            if (result.Count > 0 && result.Data) {
              $.each(result.Data[0].Table, function(i, v) {
                types.push({
                  value: v.AS_TIPSTR_ID,
                  text: v.AS_TIPSTR_DESCRIPTION,
                  MagicBOLayer_ID: v.MagicBOLayer_ID,
                });
              });
            }
          },
        });

        $("[name$=\\[structureType\\]]").kendoDropDownList({
          dataTextField: "text",
          dataValueField: "value",
          dataSource: {
            data: types,
          },
        });
        e.container
          .prev(".k-window-titlebar.k-header")
          .after($("div[data-schemaid=root]"));
        e.container
          .closest(".k-window")
          .show()
          .animate({
            marginTop: "-=150px", //moves up
          });

        $(".well").append(
          '<button id="btnlayerdoc" class="k-button proceed">' +
            getObjectText("proceed") +
            "</button>"
        );
        $("#btnlayerdoc").click(function(el) {
          var seltype = $("[name$=\\[structureType\\]]")
            .data("kendoDropDownList")
            .value();
          var currenttypelayerid = null;
          $.each(types, function(i, v) {
            if (v.value == seltype) {
              currenttypelayerid = v.MagicBOLayer_ID;
            }
          });
          var currentlayerid = null;
          if (currenttypelayerid !== null) currentlayerid = currenttypelayerid;
          // if (currentlayerid !== null) {
          $("div[data-schemaid=root]").remove();
          e.container
            .show()
            .data("kendoWindow")
            .center();
          e.container.closest(".k-window").css("marginTop", 0);
          removeTabsByLayer(e, currentlayerid).done(function() {
            e.model.set("MagicBOLayerID", currentlayerid);
            populateDataSources(e, gridname, callback);
            $("input[name=AS_STRUCT_AS_TIPSTR_ID]")
              .data("kendoDropDownList")
              .value(parseInt(seltype));

            function callback() {
              getCurrentModelInEdit().AS_STRUCT_AS_TIPSTR_ID = parseInt(
                seltype
              );
            }
            $("input[name=AS_STRUCT_AS_TIPSTR_ID]")
              .data("kendoDropDownList")
              .enable(false);
          });
        });
      });
    });
  };
  getStandardEditFunction(
    e,
    null,
    gridname,
    undefined,
    undefined,
    layerpreselect
  ); //lo appendo al fondo del 1o TAB
}
//#endregion
//#endregion

//#region TypeValues
//funzione da usare nei casi in cui ci siano associazioni di valori ai business Objects (es. dimensioni asset) in cui all' utente vengano esposte tutte le casistiche
//sulla base del tipo business objects (es.tipsas e dimensioni)
//indipendentemente dal fatto che abbiano valore o meno, questa funzione chiude il valore corrente e fa in modo che all' utente venga "riproposto" il valore a null
//richiede JSONpayload con table, pk , fieldtoreset  --> tabella da aggiornare, nome chiave primaria, campo data su cui operare l' aggiornamento
function resetTypeValues(e) {
  //il nome del campo arriva dal jsonpayload "fieldtoset"
  e.preventDefault();

  var storedprocedure =
    rowbuttonattributes[$(e.currentTarget)[0].className].storedprocedure;
  var storedproceduredataformat =
    rowbuttonattributes[$(e.currentTarget)[0].className]
      .storedproceduredataformat;
  var gridref = $(e.currentTarget)
    .closest(".k-grid")
    .data("kendoGrid");

  var jsonpayload = {};
  try {
    jsonpayload = JSON.parse(
      rowbuttonattributes[$(e.currentTarget)[0].className].jsonpayload
    );
  } catch (e) {
    console.log("jsonpayload is not a valid json:" + e.message);
  }
  var fieldtoset = jsonpayload.fieldtoreset;
  var pkname = jsonpayload.pk;
  var table = jsonpayload.table;

  var rowdata = $(e.currentTarget)
    .closest(".k-grid")
    .data("kendoGrid")
    .dataItem($(e.currentTarget).closest("tr"));
  var today = new Date();
  rowdata.set(fieldtoset, today);

  var datatopost = buildGenericPostInsertUpdateParameter(
    "destroy",
    table,
    pkname,
    storedprocedure,
    storedproceduredataformat,
    null,
    null,
    rowdata,
    rowdata[pkname]
  );
  $.ajax({
    type: "POST",
    url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
    data: datatopost,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(result) {
      kendoConsole.log("OK", false);
      gridref.dataSource.read();
    },
    error: function(message) {
      kendoConsole.log(message.responseText, true);
    },
  });
}

function returnMultiselectArevis(US_DEPROL_ID, USERID) {
  var datatopost = null;

  $.ajax({
    type: "POST",
    url: manageAsyncCallsUrl(false, "/api/RoldepArevis/GetMultiSelectArevis"),
    data: datatopost,
    async: false,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(result) {
      //return $(result).html();
      htmltorender = result;
    },
    error: function(message) {
      kendoConsole.log(message.responseText, true);
    },
  });

  //var optional = $("#arevis").kendoMultiSelect().data("kendoMultiSelect");
}
//#endregion
//#region workflow
function wf_v_form_checked(e) {
  $("#WF_V_FORM_Required input:checked").each(function() {
    if ($(this).is(":checked")) {
      $(this).removeAttr("checked");
    }
  });
  e.checked = true;
}

function solverelatedobj(e) {
  if (e.MagicBusinessObjectList === undefined) {
    console.log(
      "ERROR :: field MagicBusinessObjectList is not defined in current grid even if the solverelatedobj has been called."
    );
    return "<div>NO INFO</div>";
  }
  if (e.MagicBusinessObjectList === "") {
    return "<div>NO INFO</div>";
  }
  var ObjectList = JSON.parse(
    e.MagicBusinessObjectList
      ? e.MagicBusinessObjectList.replace(/\r?\n|\r/g, "")
      : null
  );
  var ret = "<div>";
  if (ObjectList !== null) {
    for (i = 0; i < ObjectList.length; i++) {
      if (ObjectList[i].Description !== "") {
        ret += ObjectList[i].Description;
        if (ObjectList[i].Type !== "") {
          ret += " (" + ObjectList[i].Type + ")";
        }
        ret += ", ";
      }
    }
  }
  ret = ret.substring(0, ret.length - 2) + "</div>";
  return ret;
}
//#endregion
function downloaddocumentlist(e) {
	// Helper function to get cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
  // Show modal at the beginning
  doModal(true);
  
  var entityGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var rows = entityGrid.select();
  
  if (rows.length == 0) {
    kendoConsole.log("Selezionare almeno un documento da scaricare", true);
    doModal(false); // Hide modal when no documents are selected
    return;
  }
  
  var data = [];
  rows.each(function(index, row) {
    var selectedItem = entityGrid.dataItem(row);
    var obj = {
      DO_DOCUME_ID: 0,
      OBJECT_ID: 0,
    };
    obj.DO_DOCUME_ID = selectedItem.DO_DOCUME_ID;
    obj.OBJECT_ID = selectedItem.OBJECT_ID;
    data.push(obj);
  });
  
  var objpost = {
    list: [],
  };
  objpost.list = data;
  
  $.fileDownload("/api/Documentale/ExportzipforDocumentList/", {
        data: objpost,
        httpMethod: "POST",


        successCallback: function (url, response) {
            // More reliable approach that doesn't depend solely on cookies
            setTimeout(function () {
                var jobType = getCookie("fileDownloadJobType");
                var jobStatus = getCookie("fileDownloadJobStatus");

                // Clear cookies regardless of their values
                document.cookie = "fileDownloadJobStatus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

                // Use both cookie values AND response text to determine action
                if (jobStatus === "alreadyProcessing") {
                    alert("Il documento è già in fase di elaborazione. Si prega di attendere il completamento dell'operazione corrente.");
                } else if (jobType === "rabbitmq" || (response && response.indexOf("job ID") !== -1)) {
                    // Check both cookie and response text
                    alert("L'elaborazione dei documenti è in corso. Riceverai una notifica via email quando sarà pronto per essere scaricato.");
                    document.cookie = "fileDownloadJobType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "fileDownloadJobId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                } else {
                    // Default fallback to ensure user always gets feedback
                    alert("Download avviato con successo.");
                    console.log("Document download started");
                }

                doModal(false);
            }, 1000); // Slightly longer timeout to ensure cookies are available
        },

        failCallback: function (responseHtml, url) {
            var errorMessage = "Si è verificato un errore durante il download dei documenti.";

            if (responseHtml && typeof responseHtml === "string") {
                if (responseHtml.indexOf("già in fase di elaborazione") !== -1) {
                    errorMessage = "Un documento è già in fase di elaborazione. Si prega di attendere il completamento dell'operazione corrente.";
                } else if (responseHtml.indexOf("File Mancante:") !== -1) {
                    errorMessage = responseHtml;
                } else if (responseHtml.indexOf("Servizio temporaneamente non disponibile") !== -1) {
                    errorMessage = "Servizio temporaneamente non disponibile. Si prega di riprovare più tardi. Se il problema persiste, contattare l'assistenza tecnica.";
                }
            }

            alert(errorMessage);
            console.error("Error processing document download request:", responseHtml);
            doModal(false);
        }
    });
}



var downloadReports = {};
var downloadtemplates = {};
//bottone per toolbar share with di oggetti selezionati

downloadReports["libroImpianti"] =
  '<a onclick="downloadMaintenancereport(this,3);" class="k-button k-button-icontext">\
<span class="fa fa-download" aria-hidden="true"></span>' +
  getObjectText("repLibroImpianto") +
  "</a>";

downloadReports["libroImpianti_clima"] =
  '<a onclick="downloadMaintenancereport(this,4);" class="k-button k-button-icontext">\
<span class="fa fa-download" aria-hidden="true"></span>' +
  getObjectText("repLibroImpiantoClima") +
  "</a>";

downloadtemplates["downloaddocuments"] =
  '<a onclick="downloaddocumentlist(this);" class="k-button k-button-icontext">\
                                            <span class="fa fa-download" aria-hidden="true"></span>' +
  getObjectText("download") +
  "</a>";

downloadtemplates["downloadmaintenanceplan"] =
  '<a onclick="downloadMaintenancereport(this,1);" class="k-button k-button-icontext">\
                                            <span class="fa fa-download" aria-hidden="true"></span>' +
  getObjectText("downloadmaintplan") +
  "</a>";

downloadtemplates["downloadmaintenancemanual"] =
  '<a onclick="downloadMaintenancereport(this,2);" class="k-button k-button-icontext">\
                                            <span class="fa fa-download" aria-hidden="true"></span>' +
  getObjectText("downloadmaintenancemanual") +
  "</a>";

downloadtemplates["downloadlabels"] =
  '<a onclick="downloadlabels(this);" class="k-button k-button-icontext">\
                                            <span class="fa fa-download" aria-hidden="true"></span>' +
  getObjectText("downloadlabels") +
  "</a>";

function refreshall(e) {
  var entityGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  $.each(entityGrid.dataSource.filter().filters, function(index, v) {
    if (v.type == "navigationFilter") {
      var DM_EXTRAC_ID = v.value;
      var options = {
        table: "core.DM_FIEEXT_extract_fields",
        data: {
          DM_EXTRAC_ID: DM_EXTRAC_ID,
        },
        procedure: "core.DM_FIEEXT_REFRESH",
        action: "create",
        primaryKeyColumn: "DM_FIEEXT_ID",
        contentType: "XML",
      };
      requireConfigAndMore(["MagicSDK"], function(MF) {
        MF.api.set(options);
        //MF.api.set(options).then(function (e) {
        //    $("#wndmodalContainer").modal('toggle');
        //});
      });
    }
  });
}

var selectalltemplate = {};
selectalltemplate["selectall"] =
  '<a id="seleall" onclick="selectall(this);" class="k-button k-button-icontext pull-left">\
                                        <span class="fa fa-bars" aria-hidden="true"></span>' +
  getObjectText("selectall") +
  "</a>";
$("#seleall").prop("selected", false);

var refreshtemplate = {};
refreshtemplate["DM_FIEEXT"] =
  '<a id="refreshall" onclick="refreshall(this);" class="k-button k-button-icontext">\
                                            <span class="fa fa-refresh" aria-hidden="true"></span>' +
  getObjectText("refreshall") +
  "</a>";

//#region structures
//funzione in TOOLBAR del grid di associazione delle strutture ad asset principale (Collega struttura)
function attachStructure(e) {
  var gridref = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var recordid = $("#grid")
    .data("kendoGrid")
    .dataItem(
      $(e)
        .parents("td")
        .parent("tr")
        .prev("tr")
    ).id; //assetid
  var gridobjstr = getrootgrid("AS_V_STRUCTURE");
  gridobjstr.dataSource.transport.parameterMap = function(options, operation) {
    options.EntityName = "core.AS_V_STRUCTURE";
    options.data = JSON.stringify({
      recordId: recordid,
    });
    options.layerID = null;
    options.functionID = null;
    options.operation = operation;
    options.Model = null;
    options.Columns = [];
    options.DataSourceCustomParam =
      '{ read: { type: "StoredProcedure", Definition:"core.usp_as_struct_get_all"} }';
    return kendo.stringify(options);
  };
  gridobjstr.change = function(e) {
    var selectedRow = this.select();
    var dataItem = this.dataItem(selectedRow);

    var postcontent = buildGenericPostInsertUpdateParameter(
      "create",
      "core.AS_TASTSR_asset_structure",
      "AS_STRUCT_ID",
      "core.usp_as_struct_link",
      "XML",
      -1,
      -1,
      {
        structureid: dataItem.id,
        assetid: recordid,
      },
      dataItem.id
    );
    $.ajax({
      type: "POST",
      url: "/api/GENERICSQLCOMMAND/PostU/" + dataItem.id,
      data: postcontent,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(result) {
        kendoConsole.log(getObjectText("structurelinked"), false);
        $("#wndmodalContainer").modal("toggle");
        gridref.dataSource.read();
      },
      error: function(message) {
        $("#wndmodalContainer").modal("toggle");
        kendoConsole.log(message.responseText, true);
      },
    });
  };
  //init modal
  $("#wndmodalContainer").addClass("modal-wide");
  $(".modal-title").text(getObjectText("selectstructure"));
  if ($("#contentofmodal #gridstr").data("kendoGrid"))
    $("#contentofmodal #gridstr")
      .data("kendoGrid")
      .destroy();
  $("#contentofmodal").empty();
  $("#contentofmodal").append('<div id="gridstr"></div>');
  $("#executesave").unbind("click");
  $("#executesave").hide();
  $("#wndmodalContainer").modal("toggle");

  renderGrid(gridobjstr, undefined, undefined, "gridstr");
}

function Check_actper_to(e) {
  $("#SK_ACTPER_TO")
    .data("kendoDatePicker")
    .min($(e).val());
}

function activategrids(e) {
  var info = getRowDataFromButton(e);
  var SK_CARSER_ID = info.SK_CARSER_ID;
  var gridobjstr = "";
  if (info.SK_CARSER_SK_TIPOBJ_ID == 1) gridobjstr = "SK_V_ASSCAR_AS_ASSET_L";
  if (info.SK_CARSER_SK_TIPOBJ_ID == 2) gridobjstr = "SK_V_ASSCAR_PL_ASSET_L";
  if (info.SK_CARSER_SK_TIPOBJ_ID == 3) gridobjstr = "SK_V_ASSCAR_AS_ASSELE_L";

  if ($("#contentofmodal #" + gridobjstr).data("kendoGrid"))
    $("#contentofmodal #" + gridobjstr)
      .data("kendoGrid")
      .destroy();

  $("#wndmodalContainer").addClass("modal-wide");
  $(".modal-title").text(getObjectText("selectassetforcard"));
  if ($("#contentofmodal #gridstr").data("kendoGrid"))
    $("#contentofmodal #gridstr")
      .data("kendoGrid")
      .destroy();
  $("#contentofmodal").empty();
  $("#contentofmodal").append('<div id="gridstr"></div>');
  $("#executesave").unbind("click");
  $("#executesave").hide();
  $("#wndmodalContainer").modal("toggle");

  var grid = getrootgrid(gridobjstr);
  grid.dataSource.filter = {
    field: "SK_CARREL_SK_CARSER_ID",
    operator: "eq",
    value: SK_CARSER_ID,
  };
  renderGrid(grid, undefined, undefined, "gridstr");
}

function associateacivity(e) {
  associateacivity;

  $("#wndmodalContainer").addClass("modal-wide");
  $(".modal-title").text(getObjectText("selectassetforactivity"));
  if ($("#contentofmodal #gridstr").data("kendoGrid"))
    $("#contentofmodal #gridstr")
      .data("kendoGrid")
      .destroy();
  $("#contentofmodal").empty();
  $("#contentofmodal").append('<div id="gridstr"></div>');
  $("#executesave").unbind("click");
  $("#executesave").hide();
  $("#wndmodalContainer").modal("toggle");

  var info = getRowDataFromButton(e);
  var SK_CARSER_ID = info.SK_CARSER_ID;
  var gridobjstr = "SK_V_COMACT_Combine_activity";
  var grid = getrootgrid(gridobjstr);
  grid.dataSource.filter = {
    field: "SK_CARSER_ID",
    operator: "eq",
    value: SK_CARSER_ID,
  };
  renderGrid(grid, undefined, undefined, "gridstr");
}

function editTippodXml(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  var assignedtipdoc = new $.Deferred();
  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          documentClass: {
            type: "string",
            title: getObjectText("tippod"),
          },
        },
      },
    };

    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var tippods = [];
        var rowdata = e.model;

        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "LE_USP_get_tippod",
            schema: "core",
            textfield: "CS_TIPPOD_DESCRIPTION",
            valuefield: "CS_TIPPOD_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                tippods.push({
                  CS_TIPPOD_ID: parseInt(v.value),
                  text: v.text,
                });
                //dataloader.resolve();
              });
              dataloader.resolve();
            } else {
              dataloader.resolve();
            }

            // dataloader.resolve();
          },
        });

        $.when(dataloader).then(function() {
          e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "CS_TIPPOD_ID",
            dataSource: {
              data: tippods,
            },
          });

          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=150px", //moves up
            });

          if (tippods.length > 0) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selTippod = btnwindow
                  .find("[name$=\\[documentClass\\]]")
                  .data("kendoDropDownList")
                  .value();

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", "50px");

                dataloader.resolve();
                e.model.CS_PODPNR_CS_TIPPOD_ID = parseInt(selTippod);

                if (selTippod)
                  assignedtipdoc.resolve(e.model.CS_PODPNR_CS_TIPPOD_ID);
              });
          } else {
            if (tippods.length == 0)
              kendoConsole.log(getObjectText("tippodsnotloaded"), true);
          }
        });
      });
    });
  };

  if (!e.model.isNew()) {
    assignedtipdoc.resolve(e.model.CS_PODPNR_CS_TIPPOD_ID);
  } else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }
  //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
  $.when(assignedtipdoc).then(function(detretId) {
    var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
  });
}

function editRefereXml(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  var assignedtipdoc = new $.Deferred();

  //var vcClarefCode = e.sender._data[1].LE_CLAREF_CODE;
  var vcClarefCode;

  if (e.sender.element.data("kendoGrid").dataSource._filter == undefined) {
    vcClarefCode = null;
  } else {
    var vcClarefCode = e.sender.element.data("kendoGrid").dataSource._filter
      .filters[0].value;
  }

  vcClarefCode = null;

  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          documentClass: {
            type: "string",
            title: getObjectText("claref"),
          },
          documentType: {
            type: "string",
            title: getObjectText("detref"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];

        e.model.set("LE_CLAREF_CODE", vcClarefCode);
        var rowdata = e.model;

        //var vcClareCode = e.model.
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "LE_USP_get_claref_for_user",
            schema: "core",
            textfield: "LE_CLAREF_DESCRIPTION",
            valuefield: "LE_CLAREF_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                classes.push({
                  LE_CLAREF_ID: parseInt(v.value),
                  text: v.text,
                });
              });

              $.ajax({
                type: "POST",
                url: "/api/MANAGEFK/CallFKStoredProcedure",
                data: JSON.stringify({
                  storedprocedurename: "LE_USP_get_detref_for_user",
                  schema: "core",
                  textfield: "LE_DETREF_DESCRIPTION",
                  valuefield: "LE_DETREF_ID",
                  rowdata: JSON.stringify(rowdata),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function(err) {
                  dataloader.resolve();
                },
                success: function(result) {
                  $.each(result, function(i, v) {
                    types.push({
                      value: v.LE_DETREF_ID,
                      text: v.LE_DETREF_DESCRIPTION,
                      LE_CLAREF_ID: v.LE_DETCLA_LE_CLAREF_ID,
                      //MagicBOLayer_ID: v.MagicBOLayer_ID
                      //DO_TIPDOC_DO_STADOC_ID: v.DO_TIPDOC_DO_STADOC_ID
                    });
                  });
                  dataloader.resolve();
                },
              });
            } else {
              dataloader.resolve();
            }
          },
        });

        $.when(dataloader).then(function() {
          e.container
            .find("[name$=\\[documentClass\\]]")
            .attr("id", "parentdoc");
          e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "LE_CLAREF_ID",
            dataSource: {
              data: classes,
            },
          });
          e.container.find("[name$=\\[documentType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
            cascadeFrom: "parentdoc",
          });

          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=90px", //moves up
            });

          if (types.length > 0) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[documentClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[documentType\\]]")
                  .data("kendoDropDownList")
                  .value();

                // var stadoc = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.LE_REFERE_LE_DETREF_ID = parseInt(seltype);
                e.model.LE_REFCLA_CLAREF_ID = parseInt(selclass);

                if (seltype)
                  //btnwindow.find("input[name=LE_REFCLA_CLAREF_ID]").attr("disabled");
                  //btnwindow.find("input[name=LE_REFERE_LE_DETREF_ID]").attr("disabled");

                  assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
              });
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  if (!e.model.isNew()) {
    assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
    //if (e.entityName == "core.LE_VI_REFERE_ALL") {
    //    e.container.hide();
    //    e.container.closest('.k-window').hide();
    //    layerpreselect(e);
    //}
    //else
    //{
    // assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
    //}
  } else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }

  //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
  $.when(assignedtipdoc).then(function(detretId) {
    var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
  });
}

function editRefereXmlClaref(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  var assignedtipdoc = new $.Deferred();

  //var vcClarefCode = e.sender._data[1].LE_CLAREF_CODE;
  var vcClarefCode;

  if (e.sender.element.data("kendoGrid").dataSource._filter == undefined) {
    vcClarefCode = null;
  } else {
    var vcClarefCode = e.sender.element.data("kendoGrid").dataSource._filter
      .filters[0].value;
  }

  vcClarefCode = null;

  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          documentClass: {
            type: "string",
            title: getObjectText("claref"),
          },
          documentType: {
            type: "string",
            title: getObjectText("detref"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];

        e.model.set("LE_CLAREF_CODE", vcClarefCode);
        var rowdata = e.model;

        //var vcClareCode = e.model.
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "LE_USP_get_claref_for_user",
            schema: "core",
            textfield: "LE_CLAREF_DESCRIPTION",
            valuefield: "LE_CLAREF_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                classes.push({
                  LE_CLAREF_ID: parseInt(v.value),
                  text: v.text,
                });
              });

              $.ajax({
                type: "POST",
                url: "/api/MANAGEFK/CallFKStoredProcedure",
                data: JSON.stringify({
                  storedprocedurename: "LE_USP_get_detref_for_user",
                  schema: "core",
                  textfield: "LE_DETREF_DESCRIPTION",
                  valuefield: "LE_DETREF_ID",
                  rowdata: JSON.stringify(rowdata),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function(err) {
                  dataloader.resolve();
                },
                success: function(result) {
                  $.each(result, function(i, v) {
                    types.push({
                      value: v.LE_DETREF_ID,
                      text: v.LE_DETREF_DESCRIPTION,
                      LE_CLAREF_ID: v.LE_DETCLA_LE_CLAREF_ID,
                      //MagicBOLayer_ID: v.MagicBOLayer_ID
                      //DO_TIPDOC_DO_STADOC_ID: v.DO_TIPDOC_DO_STADOC_ID
                    });
                  });
                  dataloader.resolve();
                },
              });
            } else {
              dataloader.resolve();
            }
          },
        });

        $.when(dataloader).then(function() {
          e.container
            .find("[name$=\\[documentClass\\]]")
            .attr("id", "parentdoc");
          e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "LE_CLAREF_ID",
            dataSource: {
              data: classes,
            },
          });
          e.container.find("[name$=\\[documentType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
            cascadeFrom: "parentdoc",
          });

          e.container
            .find("[name$=\\[documentType\\]]")
            .closest(".form-group")
            .hide();

          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=90px", //moves up
            });

          if (types.length > 0) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[documentClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[documentType\\]]")
                  .data("kendoDropDownList")
                  .value();

                // var stadoc = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.LE_REFERE_LE_DETREF_ID = parseInt(seltype);
                e.model.LE_REFCLA_CLAREF_ID = parseInt(selclass);

                if (seltype)
                  //btnwindow.find("input[name=LE_REFCLA_CLAREF_ID]").attr("disabled");
                  //btnwindow.find("input[name=LE_REFERE_LE_DETREF_ID]").attr("disabled");

                  assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
              });
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  if (!e.model.isNew()) {
    assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
    //if (e.entityName == "core.LE_VI_REFERE_ALL") {
    //    e.container.hide();
    //    e.container.closest('.k-window').hide();
    //    layerpreselect(e);
    //}
    //else
    //{
    // assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
    //}
  } else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }

  //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
  $.when(assignedtipdoc).then(function(detretId) {
    var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
  });
}

function associatecards(e) {
  $("#wndmodalContainer").addClass("modal-wide");
  $(".modal-title").text(getObjectText("selectassetforactivity"));
  if ($("#contentofmodal #gridstr").data("kendoGrid"))
    $("#contentofmodal #gridstr")
      .data("kendoGrid")
      .destroy();
  $("#contentofmodal").empty();
  $("#contentofmodal").append('<div id="gridstr"></div>');
  $("#executesave").unbind("click");
  $("#executesave").hide();
  $("#wndmodalContainer").modal("toggle");

  var info = getRowDataFromButton(e);
  var AS_ASSET_ID = info.AS_ASSET_ID;
  var bAsset = info.bAsset;
  var gridobjstr = "SK_V_ASSCAR_Associable_cards";
  var grid = getrootgrid(gridobjstr);
  grid.dataSource.filter = {
    logic: "and",
    filters: [
      {
        field: "AS_ASSET_ID",
        operator: "eq",
        value: AS_ASSET_ID,
      },
      {
        field: "bAsset",
        operator: "eq",
        value: bAsset,
      },
    ],
  };
  renderGrid(grid, undefined, undefined, "gridstr");
}

//#endregion

//#region dashboard-col-templates
function badge(e) {
  var badgetempl =
    '<button style="font-size:10px;border-radius:24px!important;float:right;background-color:{1};cursor:auto;" class="btn btn-primary" type="button">\
                                  {0} <span class="badge">{2}</span>\
                                </button>';
  return (
    e.Activity +
    " " +
    badgetempl.format(e.taskTypeDescription, e.Color, e.Activity_counter)
  );
}

function taskoverdue(e) {
  var d = new Date();
  if (e.DueDate < d)
    return e.description + ' <span class="label label-important">!!</span>';
  else return e.description;
}

//#endregion

//check if one date is between two dates
function dateCheck(from, to, check) {
  var fDate, lDate, cDate;
  fDate = Date.parse(from);
  lDate = Date.parse(to);
  cDate = Date.parse(check);

  if (cDate <= lDate && cDate >= fDate) {
    return true;
  }
  return false;
}

//zomm record
function showZoomRecord(e) {
  //non serve per ora....	ma lo  magari per passare il campo filtro ...
  var jsonpayload = {};
  try {
    jsonpayload = getRowJSONPayload(e);
  } catch (e) {
    console.log(e.message);
  }

  var gridName = $(e.currentTarget)
    .closest(".k-grid")
    .attr("gridname");
  var rowdata = getRowDataFromButton(e);

  if ($('[gridname="' + gridName + '"]').data("kendoGrid") !== undefined) {
    var ds = $('[gridname="' + gridName + '"]').data("kendoGrid").dataSource;

    function dataSource_change(e) {
      var filterGrid = e.sender._filter.filters;

      if (
        filterGrid.filter(function(e) {
          return e.zoom === true;
        }).length > 0
      ) {
        $(".k-plus").click();

        $("a.k-grid-zoomID > span.k-filter")
          .removeClass("k-filter")
          .addClass("k-cancel");
      }

      //var data = this.data();
    }

    ds.bind("change", dataSource_change);

    var curr_filters = ds.filter().filters;

    if ($("a.k-grid-zoomID > span.k-filter").length) {
      var new_filter = {
        field: "AS_ASSET_CODE",
        operator: "eq",
        value: rowdata.AS_ASSET_CODE,
        zoom: true,
      };
      curr_filters.push(new_filter);

      //apply the filters
      ds.filter(curr_filters);
    } else {
      $("a.k-grid-zoomID > span.k-cancel")
        .removeClass("k-cancel")
        .addClass("k-filter");

      var $grid = $('[gridname="' + gridName + '"]'),
        filter = ds.filter();

      filter = removeFiltersByType(filter, [
        "searchBar",
        "user",
        "pivot",
        undefined,
      ]); //user filters
      ds.filter(filter);
      $grid.find("#maingridsearchandfilter").val("");
      updateUserFilterLabel($grid);
    }
  }
}

function inLineCheckConstraint(e, oGrid) {
  var defer = $.Deferred();
  var gridcode = oGrid.element.attr("gridname");
  var gridentity = "core." + oGrid.element.attr("gridname");
  var data = oGrid.dataSource.data();

  var onChangeField = "";

  if (data.length > 0) {
    var selectedRowIndex = oGrid.iRow;
    var selectedCellIndex = oGrid.iCell;

    if (selectedRowIndex != undefined && selectedCellIndex != undefined) {
      var Row = data.filter(function(i, n) {
        return i.uid === data[selectedRowIndex].uid;
      });

      if (selectedRowIndex != undefined) {
        var onChangeField = oGrid.columns[selectedCellIndex].field;
        oGrid.selectable = false;

        var ds = buildXMLStoredProcedureJSONDataSource(
          {
            stageid: 0,
            gridname: gridcode,
            gridentity: gridentity,
            data: Row,
            onChangeField: onChangeField,
          },
          function(res) {
            $(res.items).each(function(i, v) {
              Row[0].set(v.ColumnName, v.EV_DEFAULT_VALUE);
            });

            defer.resolve(res.items);
          },
          "core.usp_ev_ret_grid_contraints"
        );
        ds.transport.async = false;
        ds.read();
      }
    }

    oGrid.iRow = undefined;
    oGrid.iCell = undefined;
    oGrid.refresh();

    return defer.promise();
  }
}

//function launchActionJsFunctionPers(target, ext_settings) {
//    var settings = ext_settings ? manage_Ext_settings(ext_settings) : getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
//    var rowdata = window.jqueryEditRefTreeGrid.rowData;
//    window[settings.actioncommand](rowdata, window.jqueryEditRefTreeGrid.jqgrid, ext_settings);
//    return;
//}

//function lanciaAction(rowdata,oGrid, jsonPlayLoad) {

//    console.log("ci passo");

//    var storedprocedure = "pippo"
//    var storedproceduredataformat = "XML";
//    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, null, null, rowdata, null);
//    rebuildGenericModal();
//    $("#executesave").click(function () {
//        //double click prevention
//        if ($("#executesave").attr("clicked"))
//            return;
//        $("#executesave").attr("clicked", true);
//        var data = datatopost;
//        $.ajax({
//            type: "POST",
//            url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
//            data: data,
//            contentType: "application/json; charset=utf-8",
//            dataType: "json",
//            success: function (result) {
//                var msg = "OK";
//                var msgtype = false;
//                if (result.message !== undefined) {
//                    msg = result.message;
//                    if (result.msgtype == "WARN")
//                        msgtype = "info";
//                }
//                kendoConsole.log(msg, msgtype);
//                jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataSource.read();
//                //timeout prevents double click ...
//                setTimeout(function () { $("#executesave").removeAttr("clicked"); }, 1500);
//                $("#wndmodalContainer").modal('hide');
//                if (typeof callAfterLaunchStoredProcedure == "function")
//                    callAfterLaunchStoredProcedure(rowdata);
//            },
//            error: function (message) {
//                $("#wndmodalContainer").modal('hide');
//                //timeout prevents double click ...
//                setTimeout(function () { $("#executesave").removeAttr("clicked"); }, 1500);
//                kendoConsole.log(message.responseText, true);
//            }
//        });
//    });
//    $("#wndmodalContainer").modal('toggle');

//}

function inLineCheckConstEdit(e, oGrid) {
  var gridcode = oGrid.element.attr("gridname");
  var gridentity = "core." + oGrid.element.attr("gridname");
  var data = oGrid.dataSource.data();
  e.container[0].click();

  var onChangeField = e.sender.columns[e.container[0].cellIndex].field;
  oGrid.iRow = e.container[0].closest("tr").rowIndex;
  oGrid.iCell = e.container[0].cellIndex;
  console.log(oGrid.iCell);

  if (data.length > 0) {
    var selectedRowIndex = oGrid.iRow;
    var selectedCellIndex = oGrid.iCell;

    if (selectedRowIndex == -1) {
      selectedRowIndex = 0;
    }
    if (selectedCellIndex == -1) {
      selectedCellIndex = 0;
    }

    var onChangeField = oGrid.columns[selectedCellIndex].field;
    var Row = data.filter(function(i, n) {
      return i.uid === data[selectedRowIndex].uid;
    });

    var oArray = Row[0].get("Disabilita").split(",");

    if (e.sender.columns[e.container[0].cellIndex].field == "TK_PRIANA_QTA") {
      // || e.sender.columns[e.container[0].cellIndex].field == 'TK_PRIANA_PRICE_UNIT')
      e.container.find(".k-input").attr("data-format", "n3");
      e.container.find(".k-input").attr("data-decimals", "3");
      kendo.init(e.container.find(".k-input"));
    }

    oArray.forEach(function(element) {
      if (e.sender.columns[e.container[0].cellIndex].field == element) {
        var input = e.container.find(".k-input");
        input.attr("disabled", "disabled");
      }
    });
  }
}

function repPolimi(e) {
  /*Scarica il Piano_manutenzione*/
  console.log("e:", e);
  var assetid = e.AS_ASSET_ID;
  var report = "Piano_manutenzione";

  var linkReport =
    "/Helpers/downloadreport?report=" + report + "&as_asset_id={0}&format=pdf";
  linkReport = linkReport.format(assetid.toString());
  $.fileDownload(linkReport);
}

function repManualPolimi(e) {
  /*Scarica il Manuale_manutenzione*/
  var assetid = e.AS_ASSET_ID;
  var report = "Manuale_manutenzione";

  var linkReport =
    "/Helpers/downloadreport?report=" + report + "&as_asset_id={0}&format=pdf";
  linkReport = linkReport.format(assetid.toString());
  $.fileDownload(linkReport);
}

function editImpianti(e) {
  e.sender.element.data("saveFilesAsync", false);

  //  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  e.sender.element.attr("id", "plAssetIns");
  var gridhtmlid = "plAssetIns";

  var assignedTipsas = new $.Deferred();
  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          assetClass: {
            type: "string",
            title: getObjectText("exclass"),
          },
          assetType: {
            type: "string",
            title: getObjectText("Tipologia"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];
        //  e.model.set("DO_CLADOC_FLAG_PHOTO", DO_CLADOC_FLAG_PHOTO);
        var rowdata = e.model;
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "PL_USP_GET_CLAAS",
            schema: "core",
            textfield: "PL_CLAASS_DESCRIPTION",
            valuefield: "PL_CLAASS_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                classes.push({
                  PL_CLAASS_ID: parseInt(v.value),
                  text: v.text,
                });
              });
              $.ajax({
                type: "POST",
                url: "/api/MANAGEFK/CallFKStoredProcedure",
                data: JSON.stringify({
                  storedprocedurename: "PL_USP_GET_TPSAS",
                  schema: "core",
                  textfield: "PL_TIPASS_DESCRIPTION",
                  valuefield: "PL_TIPASS_ID",
                  rowdata: JSON.stringify(rowdata),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function(err) {
                  dataloader.resolve();
                },
                success: function(result) {
                  $.each(result, function(i, v) {
                    types.push({
                      value: v.PL_TIPASS_ID,
                      text: v.PL_TIPASS_DESCRIPTION,
                      PL_CLAASS_ID: v.PL_TIPASS_CLAASS_ID,
                    });
                  });
                  dataloader.resolve();
                },
              });
            } else {
              dataloader.resolve();
            }
          },
        });
        $.when(dataloader).then(function() {
          e.container.find("[name$=\\[assetClass\\]]").attr("id", "parentAss");
          e.container.find("[name$=\\[assetClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "PL_CLAASS_ID",
            dataSource: {
              data: classes,
            },
          });
          e.container.find("[name$=\\[assetType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
            cascadeFrom: "parentAss",
          });
          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=100px", //moves up
            });

          if (types.length > 0) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[assetClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[assetType\\]]")
                  .data("kendoDropDownList")
                  .value();
                //    var stadoc = btnwindow.find("[name$=\\[assetType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.PL_ASSET_PL_TIPASS_ID = parseInt(seltype);
                e.model.PL_TIPASS_CLAASS_ID = parseInt(selclass);

                btnwindow
                  .find("input[name=PL_ASSET_PL_TIPASS_ID]")
                  .attr("disabled");
                btnwindow
                  .find("input[name=PL_TIPASS_CLAASS_ID]")
                  .attr("disabled");

                assignedTipsas.resolve(e.model.PL_ASSET_PL_TIPASS_ID);
              });
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  $.when(assignedTipsas).then(function(TipsasId) {
    //var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
    var kendoEditable = $(e.container[0]).data("kendoEditable");
    onChangeFieldmanageStageConstraints(
      e,
      "PL_TIPASS_CLAASS_ID",
      kendoEditable.options.target.element,
      kendoEditable.options.model
    );
  });

  if (!e.model.isNew()) assignedTipsas.resolve(e.model.PL_ASSET_PL_TIPASS_ID);
  else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }
}

function editImpiantiCad(e) {
  e.sender.element.data("saveFilesAsync", false);

  var cGdv = angular
    .element($('div[ng-controller="ReftreeGridViewerController as rgv"]'))
    .scope().$parent.rgv;
  cGdv.onBindGridBlock(e);

  //  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  e.sender.element.attr("id", "plAssetIns");
  var gridhtmlid = "plAssetIns";

  var assignedTipsas = new $.Deferred();
  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          assetClass: {
            type: "string",
            title: getObjectText("exclass"),
          },
          assetType: {
            type: "string",
            title: getObjectText("Tipologia"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];
        //  e.model.set("DO_CLADOC_FLAG_PHOTO", DO_CLADOC_FLAG_PHOTO);
        var rowdata = e.model;
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "PL_USP_GET_CLAAS_CAD",
            schema: "core",
            textfield: "PL_CLAASS_DESCRIPTION",
            valuefield: "PL_CLAASS_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                classes.push({
                  PL_CLAASS_ID: parseInt(v.value),
                  text: v.text,
                });
              });
              $.ajax({
                type: "POST",
                url: "/api/MANAGEFK/CallFKStoredProcedure",
                data: JSON.stringify({
                  storedprocedurename: "PL_USP_GET_TPSAS_CAD",
                  schema: "core",
                  textfield: "PL_TIPASS_DESCRIPTION",
                  valuefield: "PL_TIPASS_ID",
                  rowdata: JSON.stringify(rowdata),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function(err) {
                  dataloader.resolve();
                },
                success: function(result) {
                  $.each(result, function(i, v) {
                    types.push({
                      value: v.PL_TIPASS_ID,
                      text: v.PL_TIPASS_DESCRIPTION,
                      PL_CLAASS_ID: v.PL_TIPASS_CLAASS_ID,
                    });
                  });
                  dataloader.resolve();
                },
              });
            } else {
              dataloader.resolve();
            }
          },
        });
        $.when(dataloader).then(function() {
          e.container.find("[name$=\\[assetClass\\]]").attr("id", "parentAss");
          e.container.find("[name$=\\[assetClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "PL_CLAASS_ID",
            dataSource: {
              data: classes,
            },
          });
          e.container.find("[name$=\\[assetType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
            cascadeFrom: "parentAss",
          });
          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=100px", //moves up
            });

          if (types.length > 1) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[assetClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[assetType\\]]")
                  .data("kendoDropDownList")
                  .value();
                //    var stadoc = btnwindow.find("[name$=\\[assetType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.PL_ASSET_PL_TIPASS_ID = parseInt(seltype);
                e.model.PL_TIPASS_CLAASS_ID = parseInt(selclass);
                btnwindow
                  .find("input[name=PL_ASSET_PL_TIPASS_ID]")
                  .attr("disabled");
                btnwindow
                  .find("input[name=PL_TIPASS_CLAASS_ID]")
                  .attr("disabled");
                assignedTipsas.resolve(e.model.PL_ASSET_PL_TIPASS_ID);
              });
          } else if (types.length == 1) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[assetClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[assetType\\]]")
                  .data("kendoDropDownList")
                  .value();
                //    var stadoc = btnwindow.find("[name$=\\[assetType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.PL_ASSET_PL_TIPASS_ID = parseInt(seltype);
                e.model.PL_TIPASS_CLAASS_ID = parseInt(selclass);

                btnwindow
                  .find("input[name=PL_ASSET_PL_TIPASS_ID]")
                  .attr("disabled");
                btnwindow
                  .find("input[name=PL_TIPASS_CLAASS_ID]")
                  .attr("disabled");

                assignedTipsas.resolve(e.model.PL_ASSET_PL_TIPASS_ID);
              });

            e.model.PL_ASSET_PL_TIPASS_ID = parseInt(types[0].value);
            e.model.PL_TIPASS_CLAASS_ID = parseInt(classes[0].PL_CLAASS_ID);

            //var cGdv = angular.element($('div[ng-controller="GridDwgViewerController as gdv"]')).scope().$parent.gdv;
            //cGdv.onBindGridBlock(e);

            //e.sender.dataSource.transport.options.create.complete = cGdv.onSaveChanges;

            //e.sender.bind("edit", function (e) {
            //    if (e.model.isNew()) {
            //        if (!onEditEvent) {
            //            onEditEvent = true;
            //            e.container.data("kendoWindow").one("close", function () { console.log('ci passo')});
            //            //e.model.PL_ASSET_GUID_CAD = newHandle;
            //        }
            //    }
            //});

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click();
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  $.when(assignedTipsas).then(function(TipsasId) {
    //var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
    var kendoEditable = $(e.container[0]).data("kendoEditable");
    onChangeFieldmanageStageConstraints(
      e,
      "PL_TIPASS_CLAASS_ID",
      kendoEditable.options.target.element,
      kendoEditable.options.model
    );
  });

  if (!e.model.isNew()) assignedTipsas.resolve(e.model.PL_ASSET_PL_TIPASS_ID);
  else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }
}

function editAttiAggiuntivi(e) {
  e.sender.element.data("saveFilesAsync", false);
  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  var assignedTipsas = new $.Deferred();

  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          //assetClass: {
          //    type: "string",
          //    title: getObjectText("exclass")
          //},
          assetType: {
            type: "string",
            title: getObjectText("Tipologia"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];
        //  e.model.set("DO_CLADOC_FLAG_PHOTO", DO_CLADOC_FLAG_PHOTO);
        var rowdata = e.model;
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "PL_USP_GET_LE_TYPACT",
            schema: "core",
            textfield: "LE_TYPACT_DESCRIPTION",
            valuefield: "LE_TYPACT_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            $.each(result, function(i, v) {
              types.push({
                value: v.LE_TYPACT_ID,
                text: v.LE_TYPACT_DESCRIPTION,
              });
            });
            dataloader.resolve();
          },
        });
        $.when(dataloader).then(function() {
          e.container.find("[name$=\\[assetType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
          });

          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=100px", //moves up
            });

          if (types.length > 1) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var seltype = btnwindow
                  .find("[name$=\\[assetType\\]]")
                  .data("kendoDropDownList")
                  .value();
                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.LE_ADDROW_LE_TYPACT_ID = parseInt(seltype);
                btnwindow
                  .find("input[name=LE_ADDROW_LE_TYPACT_ID]")
                  .attr("disabled");
                assignedTipsas.resolve(e.model.LE_ADDROW_LE_TYPACT_ID);
              });
          } else if (types.length == 1) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var seltype = btnwindow
                  .find("[name$=\\[assetType\\]]")
                  .data("kendoDropDownList")
                  .value();

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.LE_ADDROW_LE_TYPACT_ID = parseInt(seltype);

                btnwindow
                  .find("input[name=LE_ADDROW_LE_TYPACT_ID]")
                  .attr("disabled");

                assignedTipsas.resolve(e.model.LE_ADDROW_LE_TYPACT_ID);
              });

            e.model.LE_ADDROW_LE_TYPACT_ID = parseInt(types[0].value);

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click();
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  $.when(assignedTipsas).then(function(TipsasId) {
    //var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
    //var kendoEditable = $(e.container[0]).data('kendoEditable');
    //onChangeFieldmanageStageConstraints(e, 'PL_TIPASS_CLAASS_ID', kendoEditable.options.target.element, kendoEditable.options.model);
  });

  if (!e.model.isNew()) assignedTipsas.resolve(e.model.PL_ASSET_PL_TIPASS_ID);
  else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }
}

function editRefassCadAction(e) {
  e.origfunction__();
  e.sender.element.data("saveFilesAsync", false);
  var cGdv = angular
    .element($('div[ng-controller="GridDwgViewerController as gdv"]'))
    .scope().$parent.gdv;
  cGdv.onBindGridBlock(e);
}

function editRefassCad(grid) {
  var dataBound = grid.dataBound;
  var originEdit = grid.edit;

  grid.dataBound = function(e) {
    dataBound.call(this, e);

    if ($('div[ng-controller="GridDwgViewerController as gdv"]').length > 0) {
      var cGdv = angular
        .element($('div[ng-controller="GridDwgViewerController as gdv"]'))
        .scope().$parent.gdv;
      e.sender.element
        .closest(".modal-content")
        .find(".modal-header")
        .find("button")
        .click(cGdv.onCloseGridNewBlocks);
    }

    //grid.dataSource.transport.update.complete = cGdv.onSaveChanges;
    //grid.dataSource.transport.update.success = cGdv.onSaveChanges;
  };

  grid.edit = function(e) {
    originEdit.call(this, e);
    cGdv.addFisicalBlock(e);
  };
}

function editAsset(e) {
  e.sender.element.data("saveFilesAsync", false);

  //  var gridhtmlid = e.sender.element.attr("id");
  var gridname = e.sender.element.attr("gridname");
  e.sender.element.attr("id", "GeoIns");
  var gridhtmlid = "GeoIns";

  var assignedTipsas = new $.Deferred();
  var layerpreselect = function(e) {
    var optionsmodel = {
      disable_properties: true,
      disable_edit_json: true,
      disable_collapse: true,
      iconlib: "bootstrap3",
      no_additional_properties: true,
      show_errors: "always",
      schema: {
        title: getObjectText("selectatypetoproceed"),
        type: "object",
        properties: {
          assetClass: {
            type: "string",
            title: getObjectText("exclass"),
          },
          assetType: {
            type: "string",
            title: getObjectText("Tipologia"),
          },
        },
      },
    };
    var dataloader = new $.Deferred();

    requireConfig(function() {
      require(["JSONEditor"], function(JSONEditor) {
        //e.container.find(".k-tabstrip").hide();
        JSONEditor.defaults.options.theme = "bootstrap3";
        var editor = new JSONEditor(e.container[0], optionsmodel);
        var classes = [];
        var types = [];
        //  e.model.set("DO_CLADOC_FLAG_PHOTO", DO_CLADOC_FLAG_PHOTO);
        var rowdata = e.model;
        $.ajax({
          type: "POST",
          url: "/api/MANAGEFK/CallFKStoredProcedure",
          data: JSON.stringify({
            storedprocedurename: "USP_AS_GetTipass",
            schema: "core",
            textfield: "AS_TIPASS_DESCRIPTION",
            valuefield: "AS_TIPASS_ID",
            rowdata: JSON.stringify(rowdata),
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          error: function(err) {
            dataloader.resolve();
          },
          success: function(result) {
            if (result.length > 0) {
              $.each(result, function(i, v) {
                classes.push({
                  AS_TIPASS_ID: parseInt(v.value),
                  text: v.text,
                });
              });
              $.ajax({
                type: "POST",
                url: "/api/MANAGEFK/CallFKStoredProcedure",
                data: JSON.stringify({
                  storedprocedurename: "USP_AS_GetTipsas",
                  schema: "core",
                  textfield: "AS_TIPSAS_DESCRIPTION",
                  valuefield: "AS_TIPSAS_ID",
                  rowdata: JSON.stringify(rowdata),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function(err) {
                  dataloader.resolve();
                },
                success: function(result) {
                  $.each(result, function(i, v) {
                    types.push({
                      value: v.AS_TIPSAS_ID,
                      text: v.AS_TIPSAS_DESCRIPTION,
                      AS_TIPASS_ID: v.AS_SUBTIP_TIPASS_ID,
                      MagicBOLayer_ID: v.MagicBOLayer_ID,
                    });
                  });
                  dataloader.resolve();
                },
              });
            } else {
              dataloader.resolve();
            }
          },
        });
        $.when(dataloader).then(function() {
          e.container.find("[name$=\\[assetClass\\]]").attr("id", "parentAss");
          e.container.find("[name$=\\[assetClass\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "AS_TIPASS_ID",
            dataSource: {
              data: classes,
            },
          });
          e.container.find("[name$=\\[assetType\\]]").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
              data: types,
            },
            cascadeFrom: "parentAss",
          });
          e.container
            .prev(".k-window-titlebar.k-header")
            .after(e.container.find("div[data-schemaid=root]"));
          e.container
            .closest(".k-window")
            .show()
            .animate({
              marginTop: "-=100px", //moves up
            });

          if (types.length > 0) {
            e.container
              .parent()
              .find(".well")
              .append(
                '<button id="btnlayerdoc" class="k-button proceed">' +
                  getObjectText("proceed") +
                  "</button>"
              );

            e.container
              .parent()
              .find("#btnlayerdoc")
              .click(function(el) {
                var btnwindow = $(el.currentTarget).closest(".k-window");
                var selclass = btnwindow
                  .find("[name$=\\[assetClass\\]]")
                  .data("kendoDropDownList")
                  .value();
                var seltype = btnwindow
                  .find("[name$=\\[assetType\\]]")
                  .data("kendoDropDownList")
                  .value();
                //    var stadoc = btnwindow.find("[name$=\\[assetType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                btnwindow.find("div[data-schemaid=root]").remove();
                e.container
                  .show()
                  .data("kendoWindow")
                  .center();
                e.container.closest(".k-window").css("marginTop", 0);
                e.model.AS_ASSET_TIPSAS_ID = parseInt(seltype);
                e.model.AS_ASSET_TIPASS_ID = parseInt(selclass);
                // if (stadoc)
                //     e.model.DO_DOCUME_DO_STADOC_ID = parseInt(stadoc);

                btnwindow
                  .find("input[name=AS_ASSET_TIPASS_ID]")
                  .attr("disabled");
                btnwindow
                  .find("input[name=AS_ASSET_TIPSAS_ID]")
                  .attr("disabled");

                // var closeValidationTooltip = function () {
                //    btnwindow.find("input[name=DO_DOCUME_DO_STADOC_ID]").closest('div').find(".k-widget .k-tooltip a").trigger("click");
                //    btnwindow.find("div.k-tab-error-underline").remove();
                //  }
                assignedTipsas.resolve(e.model.AS_ASSET_TIPSAS_ID);
              });
          } else {
            if (classes.length == 0)
              kendoConsole.log(getObjectText("classesnotloaded"), true);
            else kendoConsole.log(getObjectText("typesnotloaded"), true);
          }
        });
      });
    });
  };

  $.when(assignedTipsas).then(function(TipsasId) {
    //var selectDataBoundsPromises;
    selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
  });

  if (!e.model.isNew()) assignedTipsas.resolve(e.model.AS_ASSET_TIPSAS_ID);
  else {
    e.container.hide();
    e.container.closest(".k-window").hide();
    layerpreselect(e);
  }
}

function viewerPDF(e) {
    var jsonpayload = {},
        pdfViewerController = $("#pdf-viewer-controller");

    try {
        jsonpayload = getRowJSONPayload(e);
        jsonpayload.rowData = getRowDataFromButton(e);
    } catch (ex) {
        kendoConsole.log("jsonpayload is not a valid json: " + ex.message, true);
        return;
    }

    if (
        jQuery.isEmptyObject(jsonpayload.controllerName) ||
        jQuery.isEmptyObject(jsonpayload.rowData[jsonpayload.path]) ||
        jQuery.isEmptyObject(jsonpayload.rowData[jsonpayload.nomeFile])
    ) {
        kendoConsole.log(
            'Configurrazione errata controlla jsonpayload {"path":"pathFile", "nomeFile":"fileName","controllerName":"pdfViewerController"}',
            true
        );
        return;
    }

    var patFile = jsonpayload.rowData[jsonpayload.path],
        nomeFile = jsonpayload.rowData[jsonpayload.nomeFile],
        pathFileComplete = jsonpayload.rowData[jsonpayload.path] + jsonpayload.rowData[jsonpayload.nomeFile],
        rowData = jsonpayload.rowData,
        reftreeServiceCode = jsonpayload.reftreeServiceCode ? jsonpayload.reftreeServiceCode : "",
        gridParent = $(e.currentTarget).closest(".k-grid").parents(".k-grid").attr("gridName"),
        downloadNotPdf = jsonpayload.hasOwnProperty('downloadFileNoPdf') ? jsonpayload.downloadFileNoPdf : false
	
    var fileUrl = new $.Deferred();
    if (downloadNotPdf && !nomeFile.toLowerCase().endsWith(".pdf")) {
        kendoConsole.log("Il file non è un pdf, elaborazione avviata.", false);
    }

    if (jsonpayload.reftreeServiceCode) {
        var data = {
            dataRow: rowData,
            reftreeServiceCode: reftreeServiceCode,
			gridParent : gridParent
        }
 
        //return $.ajax({
        //    type: "POST",
        //    url: "/api/RefTreeServices/StartServiceFromModelNew/",
        //    data: SON.stringify(data),
        //    contentType: "application/json; charset=utf-8",
        //    dataType: "json",
        //    success: function (res) {
        //        fileUrl.resolve(res.Response);
        //    },
        //    error: function (err) {
        //        fileUrl.resolve(pathFileComplete);
        //    }
        //});


        StartServiceFromModel(JSON.stringify(data)).then(
            function (res) {
                //console.log(res);
                //inserire codice del Blob
                fileUrl.resolve(res.Response);
            },
            function (err) {
                //console.log(err);
                //kendoConsole.log(err.responseText, true);
                //fileUrl.reject("");
                fileUrl.resolve(pathFileComplete);
            }
        );
        
    } else {
        fileUrl.resolve(pathFileComplete);
    }

    $.when(fileUrl).then(function (res) {
        if (res == "")
            return kendoConsole.log("Nessun file elaborato", true);


        var config = {
            patFile: patFile,
            nomeFile: nomeFile,
            pathFileComplete: res,
            rowData: rowData,
            reftreeServiceCode: reftreeServiceCode,
            downloadNotPdf: downloadNotPdf,
            ready: function () {
                var interval = setInterval(function () {
                    var fadeout = pdfViewerController.find(".fadeout");
                    if (fadeout.length > 0) {
                        clearInterval(interval);
                        $("#pdf-viewer-controller-spinner").remove();
                        fadeout.addClass("fadein");
                    }
                }, 100);
            },
            close: function (e) {
                $("#idPdfViewer")
                    .find("#btnExit")
                    .click();
            },
        };

        pdfViewerController = $('<div id="pdf-viewer-controller">').append($(getAngularControllerElement(jsonpayload.controllerName, config)).addClass("fadeout"));
        pdfViewerController.append('<div id="pdf-viewer-controller-spinner" style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + "</div>");

    }, function (err) {
        console.log(err);
    });
}

function qrCodeR3(e, options) {
  grid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");

  if ((grid.select().length = 0)) {
    return;
  }

  var key = !e.id ? e.className : e.id;
  var jsonpayload = {};
  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
  } catch (e) {
    kendoConsole.log("JsonPayload is not valid", true);
    return;
  }

  var divQrCodeR3 =
    '<div id="divQrCodeR3" style="position: relative; z-index: -1;"></div>';

  $("#appcontainer").append(divQrCodeR3);

  $("#divQrCodeR3").empty();
  $.each(grid.select(), function(i, v) {
    pdfExport = "";
    pdfExport +=
      '<div id="qrcodeframe' +
      i +
      '" ' +
      (!!jsonpayload.styleDivFrame ? jsonpayload.styleDivFrame : "") +
      ">"; //
    pdfExport +=
      '<div id="qrcodeexport' + i + '" style="display: table;"></div>';
    if (jsonpayload.showLabel) {
      pdfExport +=
        '<br /><div id="qrCodeTitle" ' +
        (!!jsonpayload.styleDivTitle
          ? jsonpayload.styleDivTitle
          : "style='margin-top: -5px;'") +
        " ><p " +
        (!!jsonpayload.styleTitle ? jsonpayload.styleTitle : "") +
        " >" +
        grid.dataItem(grid.select()[i])[jsonpayload.barcodeDesciption] +
        "</p></div>";
    }
    pdfExport += "</div>";

    $("#divQrCodeR3").append(pdfExport);

    $("#qrcodeexport" + i).kendoQRCode({
      value: grid.dataItem(grid.select()[i])[jsonpayload.barCodeValue],
      size: jsonpayload.size,
    });
  });

  kendo.drawing
    .drawDOM($("#divQrCodeR3"), {
      forcePageBreak: ".new-page",
      paperSize: !!jsonpayload.paperSize ? jsonpayload.paperSize : "A4",
      landscape: jsonpayload.landscape ? jsonpayload.landscape : false,
      margin: {
        left: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "",
        top: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "", //(!!jsonpayload.marginPage.top ? jsonpayload.marginPage.top : ""),
        right: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "", //(!!jsonpayload.marginPage.right ? jsonpayload.marginPage.right : ""),
        bottom: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "", //(!!jsonpayload.marginPage.bottom ? jsonpayload.marginPage.bottom : "")
      },
    })
    .then(function(group) {
      return kendo.drawing.exportPDF(group);
    })
    .done(function(data) {
      kendo.saveAs({
        dataURI: data,
        fileName: jsonpayload.nomeFile,
      });
    });
}

var ceiImm = {
  MD5Conv: function(s) {
    function L(k, d) {
      return (k << d) | (k >>> (32 - d));
    }

    function K(G, k) {
      var I, d, F, H, x;
      F = G & 2147483648;
      H = k & 2147483648;
      I = G & 1073741824;
      d = k & 1073741824;
      x = (G & 1073741823) + (k & 1073741823);
      if (I & d) {
        return x ^ 2147483648 ^ F ^ H;
      }
      if (I | d) {
        if (x & 1073741824) {
          return x ^ 3221225472 ^ F ^ H;
        } else {
          return x ^ 1073741824 ^ F ^ H;
        }
      } else {
        return x ^ F ^ H;
      }
    }

    function r(d, F, k) {
      return (d & F) | (~d & k);
    }

    function q(d, F, k) {
      return (d & k) | (F & ~k);
    }

    function p(d, F, k) {
      return d ^ F ^ k;
    }

    function n(d, F, k) {
      return F ^ (d | ~k);
    }

    function u(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(r(F, aa, Z), k), I));
      return K(L(G, H), F);
    }

    function f(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(q(F, aa, Z), k), I));
      return K(L(G, H), F);
    }

    function D(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(p(F, aa, Z), k), I));
      return K(L(G, H), F);
    }

    function t(G, F, aa, Z, k, H, I) {
      G = K(G, K(K(n(F, aa, Z), k), I));
      return K(L(G, H), F);
    }

    function e(G) {
      var Z;
      var F = G.length;
      var x = F + 8;
      var k = (x - (x % 64)) / 64;
      var I = (k + 1) * 16;
      var aa = Array(I - 1);
      var d = 0;
      var H = 0;
      while (H < F) {
        Z = (H - (H % 4)) / 4;
        d = (H % 4) * 8;
        aa[Z] = aa[Z] | (G.charCodeAt(H) << d);
        H++;
      }
      Z = (H - (H % 4)) / 4;
      d = (H % 4) * 8;
      aa[Z] = aa[Z] | (128 << d);
      aa[I - 2] = F << 3;
      aa[I - 1] = F >>> 29;
      return aa;
    }

    function B(x) {
      var k = "",
        F = "",
        G,
        d;
      for (d = 0; d <= 3; d++) {
        G = (x >>> (d * 8)) & 255;
        F = "0" + G.toString(16);
        k = k + F.substr(F.length - 2, 2);
      }
      return k;
    }

    function J(k) {
      k = k.replace(/rn/g, "n");
      var d = "";
      for (var F = 0; F < k.length; F++) {
        var x = k.charCodeAt(F);
        if (x < 128) {
          d += String.fromCharCode(x);
        } else {
          if (x > 127 && x < 2048) {
            d += String.fromCharCode((x >> 6) | 192);
            d += String.fromCharCode((x & 63) | 128);
          } else {
            d += String.fromCharCode((x >> 12) | 224);
            d += String.fromCharCode(((x >> 6) & 63) | 128);
            d += String.fromCharCode((x & 63) | 128);
          }
        }
      }
      return d;
    }
    var C = Array();
    var P, h, E, v, g, Y, X, W, V;
    var S = 7,
      Q = 12,
      N = 17,
      M = 22;
    var A = 5,
      z = 9,
      y = 14,
      w = 20;
    var o = 4,
      m = 11,
      l = 16,
      j = 23;
    var U = 6,
      T = 10,
      R = 15,
      O = 21;
    s = J(s);
    C = e(s);
    Y = 1732584193;
    X = 4023233417;
    W = 2562383102;
    V = 271733878;
    for (P = 0; P < C.length; P += 16) {
      h = Y;
      E = X;
      v = W;
      g = V;
      Y = u(Y, X, W, V, C[P + 0], S, 3614090360);
      V = u(V, Y, X, W, C[P + 1], Q, 3905402710);
      W = u(W, V, Y, X, C[P + 2], N, 606105819);
      X = u(X, W, V, Y, C[P + 3], M, 3250441966);
      Y = u(Y, X, W, V, C[P + 4], S, 4118548399);
      V = u(V, Y, X, W, C[P + 5], Q, 1200080426);
      W = u(W, V, Y, X, C[P + 6], N, 2821735955);
      X = u(X, W, V, Y, C[P + 7], M, 4249261313);
      Y = u(Y, X, W, V, C[P + 8], S, 1770035416);
      V = u(V, Y, X, W, C[P + 9], Q, 2336552879);
      W = u(W, V, Y, X, C[P + 10], N, 4294925233);
      X = u(X, W, V, Y, C[P + 11], M, 2304563134);
      Y = u(Y, X, W, V, C[P + 12], S, 1804603682);
      V = u(V, Y, X, W, C[P + 13], Q, 4254626195);
      W = u(W, V, Y, X, C[P + 14], N, 2792965006);
      X = u(X, W, V, Y, C[P + 15], M, 1236535329);
      Y = f(Y, X, W, V, C[P + 1], A, 4129170786);
      V = f(V, Y, X, W, C[P + 6], z, 3225465664);
      W = f(W, V, Y, X, C[P + 11], y, 643717713);
      X = f(X, W, V, Y, C[P + 0], w, 3921069994);
      Y = f(Y, X, W, V, C[P + 5], A, 3593408605);
      V = f(V, Y, X, W, C[P + 10], z, 38016083);
      W = f(W, V, Y, X, C[P + 15], y, 3634488961);
      X = f(X, W, V, Y, C[P + 4], w, 3889429448);
      Y = f(Y, X, W, V, C[P + 9], A, 568446438);
      V = f(V, Y, X, W, C[P + 14], z, 3275163606);
      W = f(W, V, Y, X, C[P + 3], y, 4107603335);
      X = f(X, W, V, Y, C[P + 8], w, 1163531501);
      Y = f(Y, X, W, V, C[P + 13], A, 2850285829);
      V = f(V, Y, X, W, C[P + 2], z, 4243563512);
      W = f(W, V, Y, X, C[P + 7], y, 1735328473);
      X = f(X, W, V, Y, C[P + 12], w, 2368359562);
      Y = D(Y, X, W, V, C[P + 5], o, 4294588738);
      V = D(V, Y, X, W, C[P + 8], m, 2272392833);
      W = D(W, V, Y, X, C[P + 11], l, 1839030562);
      X = D(X, W, V, Y, C[P + 14], j, 4259657740);
      Y = D(Y, X, W, V, C[P + 1], o, 2763975236);
      V = D(V, Y, X, W, C[P + 4], m, 1272893353);
      W = D(W, V, Y, X, C[P + 7], l, 4139469664);
      X = D(X, W, V, Y, C[P + 10], j, 3200236656);
      Y = D(Y, X, W, V, C[P + 13], o, 681279174);
      V = D(V, Y, X, W, C[P + 0], m, 3936430074);
      W = D(W, V, Y, X, C[P + 3], l, 3572445317);
      X = D(X, W, V, Y, C[P + 6], j, 76029189);
      Y = D(Y, X, W, V, C[P + 9], o, 3654602809);
      V = D(V, Y, X, W, C[P + 12], m, 3873151461);
      W = D(W, V, Y, X, C[P + 15], l, 530742520);
      X = D(X, W, V, Y, C[P + 2], j, 3299628645);
      Y = t(Y, X, W, V, C[P + 0], U, 4096336452);
      V = t(V, Y, X, W, C[P + 7], T, 1126891415);
      W = t(W, V, Y, X, C[P + 14], R, 2878612391);
      X = t(X, W, V, Y, C[P + 5], O, 4237533241);
      Y = t(Y, X, W, V, C[P + 12], U, 1700485571);
      V = t(V, Y, X, W, C[P + 3], T, 2399980690);
      W = t(W, V, Y, X, C[P + 10], R, 4293915773);
      X = t(X, W, V, Y, C[P + 1], O, 2240044497);
      Y = t(Y, X, W, V, C[P + 8], U, 1873313359);
      V = t(V, Y, X, W, C[P + 15], T, 4264355552);
      W = t(W, V, Y, X, C[P + 6], R, 2734768916);
      X = t(X, W, V, Y, C[P + 13], O, 1309151649);
      Y = t(Y, X, W, V, C[P + 4], U, 4149444226);
      V = t(V, Y, X, W, C[P + 11], T, 3174756917);
      W = t(W, V, Y, X, C[P + 2], R, 718787259);
      X = t(X, W, V, Y, C[P + 9], O, 3951481745);
      Y = K(Y, h);
      X = K(X, E);
      W = K(W, v);
      V = K(V, g);
    }
    var i = B(Y) + B(X) + B(W) + B(V);
    return i.toLowerCase();
  },

  viewCard: function(e, dataRow) {
    if (e) {
      var username = window.Username;
      // var dataRow=this.dataItem($(e.currentTarget).closest("tr"));
      var codDiocesi = dataRow.CodiceDiocesi;
      var provenienza = "SIDIOpen BI2";
      var idProfilo = 1;
      var mode = "view";
      var codSistema = "F47C4711F4AF4A48BDB9BDFE9D6DD669";
      var schedaID = dataRow.Codice_interno_edificio;
      var string =
        codSistema +
        "-" +
        codDiocesi +
        "-" +
        username +
        "-" +
        1 +
        "-sobiceiimmobili-" +
        schedaID +
        "-" +
        mode;
      var token = this.MD5Conv(string);

      var censChiese =
        "http://testbbcc.glauco.it/CEIImmobili/verifyLogin.jsp?idDiocesi=" +
        codDiocesi +
        "&username=" +
        username +
        "&provenienza=" +
        provenienza +
        "&idProfilo=" +
        idProfilo +
        "&id=" +
        schedaID +
        "&mode=" +
        mode +
        "&token=" +
        token;

      console.log(censChiese);

      window.open(censChiese);
    }
    //console.log( "viewCard" );
  },
};

function ssoCeiImm(e) {
  var dataRow = this.dataItem($(e.currentTarget).closest("tr"));
  ceiImm.viewCard(e, dataRow);
}

function checkStartupCompany(testDate, noOfDays) {
  /*
          Marco: return boolean
      */
  var startDate = new Date(testDate);
  var giorni = noOfDays;

  console.log("testDate " + testDate);

  Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
  };

  // millisecondi trascorsi fino ad ora dal 1/1/1970
  var oggimilli = startDate.getTime();

  // valore in millisecondi dei giorni da aggiungere
  var millisecondi = 24 * 60 * 60 * 1000 * parseInt(giorni);

  //millisecondi alla data finale
  var milliseTotali = millisecondi + oggimilli;

  //data finale in millisecondi

  var newDate = startDate.addDays(giorni);

  console.log(dataFutura);

  var currentDate = new Date();
  console.log(currentDate);

  var isStartup = false;
  if (currentDate > newDate) {
    isStartup = false;
  } else {
    isStartup = true;
  }

  return isStartup;
  console.log(isStartup);
}

function dropDownListRemoveNA(container, options) {
  console.log(container);
  console.log(options);
  //var input = $("<input/>");
  //input.attr("name", options.field);
  //input.appendTo(container);
  //input.kendoTimePicker({
  //    dateInput: true
  //});
}

function formatInputNumber(e) {
  e.origfunction__();

  if (!!e.container) {
    var oItem = e.container.find('input[data-format="n0"]');

    oItem.bind("change", function(i, input) {
      var oItem = $(i.currentTarget);
      oItem.prev("input").val(oItem.val().replace(".", ""));
    });

    oItem.bind("focusout", function(i, input) {
      var oItem = $(i.currentTarget);
      oItem.prev("input").val(oItem.val().replace(".", ""));
    });

    $.each(oItem, function(i, v) {
      $(v)
        .prev("input")
        .val(
          $(v)
            .val()
            .replace(".", "")
        );
    });
  }
}

function formatInputDecimal(e) {
  console.log(e);
}

function colorInLineItem(e) {
  var tr = $(e).closest(".k-grid tr");
  var model = $(e)
    .closest(".k-grid")
    .data("kendoGrid")
    .dataItem(tr);
  model[$(e).attr("column")] = e.value;
}

function editor_timepiker(container, options) {
  var input = $("<input/>");
  input.attr("name", options.field);
  input.appendTo(container);
  input.kendoTimePicker({
    dateInput: true,
  });
}

function customHtmlPageR3(e) {
  var jsonpayload = {};
  try {
    jsonpayload = getRowJSONPayload(e);
  } catch (e) {
    console.log("jsonpayload is not a valid json:" + e.message);
  }

  jsonpayload.rowData = getRowDataFromButton(e);
  var selector = e.currentTarget ? e.currentTarget : e;
  jsonpayload.jqgrid = $(selector).closest(".k-grid");
  jsonpayload.jrow = $(selector).closest(".k-grid tr");
  jsonpayload.model = getRowDataFromButton(e);
  jsonpayload.model.id = jsonpayload.model[jsonpayload.actioncommand.primaryKeyName];
  jsonpayload.modalId = jsonpayload.form ? jsonpayload.form.formName : "wndmodalContainer-r3";

  var settings = (window.jqueryEditRefTreeGrid = {
    jqgrid: jsonpayload.jqgrid,
    jrow: jsonpayload.jrow,
    rowData: jsonpayload.rowData,
    jModalId: jsonpayload.modalId,
    });

  var rowData = window.jqueryEditRefTreeGrid.rowData;
  var gridName = window.jqueryEditRefTreeGrid.jqgrid.attr("gridname");

  if (!!jsonpayload.actioncommand.controller) {
    if (!jsonpayload.actioncommand.fullScreen) {
      jsonpayload.actioncommand.fullScreen = false;
    }

    var config = {};
    config = jsonpayload;
    config.grid = jsonpayload.jqgrid.data().kendoGrid;
    var myController = getAngularControllerElement(
      config.actioncommand.controller,
      config
    );
    $(myController).css("height", "100%");
    showModalCustomR3(
      {
        title: '<i aria-hidden="true"></i>',
        wide: true,
        backdrop: false,
        content: myController,
        onClose: function() {
            $("#" + config.modalId).remove();
            window.treeControllerR3 = undefined;
            config.grid.dataSource.read();
            config.grid.refresh();
        },
        modalId: config.modalId,
        fullScreen: config.actioncommand.fullScreen,
      },
      true
    );
  } else {
    showItemCustomFormReftree(
      jsonpayload.model,
      gridName,
      jsonpayload.actioncommand.storedProcedure,
      jsonpayload.actioncommand.controllerName,
      jsonpayload.jqgrid,
      jsonpayload.jrow,
      jsonpayload.modalId
    );
    }



}

function showItemCustomFormReftree(
  rowData,
  gridName,
  storedProcedure,
  controllerName,
  $grid,
  $row,
  modalId
) {
  if (!controllerName) controllerName = "FormOptionsController";
  var config = {};
  requireConfigAndMore(["MagicSDK"], function(MF) {
    config.model = rowData;
    config.$grid = $grid;
    config.$row = $row;
    config.options = rowData;
    config.modalId = modalId;

    MF.api
      .get({
        storedProcedureName: storedProcedure,
        data: $.extend(rowData, {
          gridName: gridName,
        }),
      })
      .then(function(res) {
        var page = res[0][0].HtmlPage;

        //page = "/Views/3/Templates/Custom/Asset_form.html"

        if ($("div.itemReport").length) $("div.itemReport").remove();

        var element = $(
          "<div class='itemReport'><div id='datahidden'/><div id='mg-form' ng-controller='" +
            controllerName +
            " as foc' ng-include=\"'" +
            window.includesVersion +
            page +
            "'\">" +
            largeSpinnerHTML +
            "</div></div>"
        );

        $("#appcontainer").data("customItemInfo", config.model); //adds the data to the js domain

        var $modalContent = showModalCustomR3(
          {
            title: '<i class="fa fa-television"></i>',
            content: element,
            wide: true,
            onClose: function() {
              $("#" + config.modalId).remove();
            },
            modalId: config.modalId,
          },
          true
        );

        initAngularController($("#mg-form"), controllerName, config);
      });
  });
}

function showModalCustomR3(config, dontClean) {
  //$("#wndmodalContainer-r3").remove();
  var modalId = config.modalId ? config.modalId : "wndmodalContainer-r3";
  $("#" + modalId).remove();

  var $modal = $(
      '<div id="' +
        modalId +
        '" class="modal fade">\
                                <div class="modal-dialog-r3">\
                                    <div class="' +
        (config.fullScreen ? "modal-content-all-r3" : "modal-content-r3") +
        '">\
                                        <div class="modal-header-r3">\
                                        <button ng-model="button" id="btnExit" class="btn btn-danger pull-right" data-dismiss="modal">X</button>\
                                            <h4 class="modal-title-r3"></h4>\
                                        </div>\
                                        <div id="contentofmodalr3" class="modal-body-r3">\
                                        </div>\
                                        <div class="modal-footer-r3">\
                                        </div>\
                                        </div>\
                                    </div>\
                                </div>\
                            </div>'
    ),
    $content;

  $modal.insertBefore("#appcontainer");

  if (!config) config = {};

  if (!dontClean) $content = cleanModal();
  else $content = $modal.find("#contentofmodalr3");

  if (config.content) {
    if (typeof config.content == "string") $content.html(config.content);
    else $content.html("").prepend(config.content);
  }
  if (config.title) $modal.find(".modal-title-r3").html(config.title);
  if (config.footer) $modal.find(".modal-footer-r3").html(config.footer);
  else $modal.find(".modal-footer-r3").hide();
  if (config.wide) $modal.addClass("modal-wide");
  if (config.onClose) {
    $modal.one("hidden.bs.modal", config.onClose);
  }

  $(".modal-content-r3").resizable({
    alsoResize: ".modal-content-r3",
    minHeight: 300,
    minWidth: 300,
  });

  //$('.modal-dialog-r3').draggable();

  $(".modal-dialog-r3").draggable({
    handle: ".modal-header-r3",
    containment: "window",
  });

  $("#draggable").draggable({
    containment: "window",
  });

  $modal.modal({
    backdrop: false,
  });

  return $content;
}

//function openSubModalUiRefTree() {
//    define([
//        "angular",
//        "angular-ui-bootstrap",
//    ], function (angular) {
//        return angular
//            .module("openModal", [
//                "ui.bootstrap",
//            ])
//            .controller("prova", [
//                "$scope",
//                "$uibModal",
//                function (config, $compile, $uibModal,
//                    //, $uibModalInstance
//                ) {

//                    var self = this;

//                }
//            ])

//    });

//}

function uploadColumnTemplateRef2Multi(
  nomeFile,
  pathNomeFile,
  etichetta,
  pathFile
) {
  if (!nomeFile) {
    return "";
  }

  var files = nomeFile.split(",");
  var output = "";
  var icon = "";
  var testo = !!etichetta ? etichetta[self.culture] : "";

  if (files.length > 1) {
    console.log(nomeFile);
  }

  $.each(files, function(i, v) {
    //if (output != '') {
    //    output += '<br>';
    //}

    try {
      ext = v.substring(v.lastIndexOf("."), v.length);

      //var name = v.split('.');
    } catch (ex) {
      ext = "";

      console.log(ex);
    }

    switch (ext.toLowerCase()) {
      case "gif":
      case "jpg":
      case "jpe":
      case "jpeg":
      case "png":
        icon = "image-o";
        break;
      case "pdf":
        icon = "pdf-o";
        break;
      case "doc":
      case "docx":
        icon = "word-o";
        break;
      case "xls":
      case "xlsx":
        icon = "excel-o";
        break;
      case "txt":
        icon = "text-o";
        break;
      case "ppt":
      case "pptx":
        icon = "powerpoint-o";
        break;
      case "zip":
      case "rar":
        icon = "archive-o";
        break;
      case "exe":
      case "css":
      case "js":
      case "html":
        icon = "code-o";
        break;
      default:
        icon = "o";
    }

    icon = "fa fa-file-" + icon;

    if (testo != "") {
      icon = "";
    }

    output += '<div class="file-list-r3">';
    output +=
      '<a target="_blank" title="' +
      v +
      '" class="k-button k-button-icontext" href="/api/MAGIC_SAVEFILE/GetFile?path=' +
      encodeURIComponent(pathFile + v) +
      '"><span class="' +
      icon +
      '">' +
      (testo != "" ? testo : "") +
      "</span></a>";
    output += "</div>";
  });

  return output;
}

function uploadColumnTemplateRef2(nomeFile, pathNomeFile, etichetta) {
  if (!nomeFile) {
    return "";
  }

  var output = "";
  var icon = "";
  var testo = !!etichetta ? etichetta[self.culture] : "";

  try {
    ext = nomeFile.substring(nomeFile.lastIndexOf(".") + 1, nomeFile.length);
  } catch (ex) {
    ext = "";

    console.log(ex);
  }

  switch (ext.toLowerCase()) {
    case "gif":
    case "jpg":
    case "jpe":
    case "jpeg":
    case "png":
      icon = "image-o";
      break;
    case "pdf":
      icon = "pdf-o";
      break;
    case "doc":
    case "docx":
      icon = "word-o";
      break;
    case "xls":
    case "xlsx":
      icon = "excel-o";
      break;
    case "txt":
      icon = "text-o";
      break;
    case "ppt":
    case "pptx":
      icon = "powerpoint-o";
      break;
    case "zip":
    case "rar":
      icon = "archive-o";
      break;
    case "exe":
    case "css":
    case "js":
    case "html":
      icon = "code-o";
      break;
    default:
      icon = "o";
  }

  icon = "fa fa-file-" + icon;

  if (testo != "") {
    icon = "";
  }

  output = '<div class="file-list-r3">';
  output +=
    '<a target="_blank" title="' +
    nomeFile +
    '" class="k-button k-button-icontext" href="/api/MAGIC_SAVEFILE/GetFile?path=' +
    encodeURIComponent(pathNomeFile) +
    '"><span class="' +
    icon +
    '">' +
    (testo != "" ? testo : "") +
    "</span></a>";
  output += "</div>";

  return output;
}

function uploadColumnTemplateMultiR3(columnName, model, element) {
  var uploadInfo = model[0].fields[columnName].uploadInfo || {},
    path = managesavepath(uploadInfo.savePath) || "",
    useController = false;
  if (!uploadInfo.adminUpload) {
    useController = window.FileUploadRootDir || !path.match(/^\//);
  } else if (!path) {
    useController = true; //is adminUpload and no savepath is set, use controller to get filedir from DB
  } else {
    path = ""; //is adminUpload and savepath is set, so clear savepath -> saved in filename
  }

  return function(data) {
    if (data[columnName]) {
      var files = data[columnName].match(/^\[{/)
          ? JSON.parse(data[columnName])
          : [{ name: data[columnName] }],
        output = "";
      var path = data["pathFile"];
      if (files.length) {
        $.each(files, function(k, v) {
          output += uploadTemplateR3(
            v,
            path,
            useController,
            uploadInfo.adminUpload,
            false,
            element ? element.gridcode : null,
            columnName
          );
        });

        output = '<div class="file-list-r3">' + output + "</div>";
      }
      return output;
    }

    return "";
  };

  //if (!nomeFile) {
  //    return '';
  //}

  //oListFile = $.parseJSON(nomeFile);
  //var output = '';

  //$.each($.parseJSON(nomeFile), function (i, v) {

  //    var icon = '';
  //    var testo = !!etichetta ? etichetta[self.culture] : '';
  //    var fileName = v.name;

  //    try {
  //        var name = fileName.split('.');
  //        if (name.length > 1) ext = name[name.length - 1];
  //        else ext = '';
  //    } catch (ex) {
  //        console.log(ex);
  //    }

  //    switch (ext.toLowerCase()) {
  //        case 'gif':
  //        case 'jpg':
  //        case 'jpe':
  //        case 'jpeg':
  //        case 'png':
  //            icon = 'image-o';
  //            break;
  //        case 'pdf':
  //            icon = 'pdf-o';
  //            break;
  //        case 'doc':
  //        case 'docx':
  //            icon = 'word-o';
  //            break;
  //        case 'xls':
  //        case 'xlsx':
  //            icon = 'excel-o';
  //            break;
  //        case 'txt':
  //            icon = 'text-o';
  //            break;
  //        case 'ppt':
  //        case 'pptx':
  //            icon = 'powerpoint-o';
  //            break;
  //        case 'zip':
  //        case 'rar':
  //            icon = 'archive-o';
  //            break;
  //        case 'exe':
  //        case 'css':
  //        case 'js':
  //        case 'html':
  //            icon = 'code-o';
  //            break;
  //        default:
  //            icon = 'o';
  //    }

  //    icon = 'fa fa-file-' + icon;

  //    if (testo != '') {
  //        icon = '';
  //    }

  //    output = output + '<div class="file-list-r3">';

  //    output +=
  //        '<a target="_blank" title="' +
  //    fileName +
  //        '" class="k-button k-button-icontext" href="/api/MAGIC_SAVEFILE/GetFile?path=' +
  //    pathFile + fileName +
  //        '"><span class="' +
  //        icon +
  //        '">' +
  //        (testo != '' ? testo : '') +
  //        '</span></a>';
  //    output += '</div>';

  //});

  //return output;
}

function uploadTemplateR3(
  e,
  path,
  useController,
  adminAreaUpload,
  isKendoField,
  gridName,
  colName
) {
  var output = "";
  if (e) {
    e.name.replace(/^\/api\/MAGIC_SAVEFILE\/GetFile\?path=/i, "");
    var name = e.name.replace(/^(\/\S+\/)?\d{13,}-/, ""),
      ext = null,
      icon = "";

    try {
      var splitName = name.split(".");
      if (splitName.length > 1) ext = splitName[splitName.length - 1];
      else ext = "";
    } catch (ex) {
      console.log(ex);
    }

    switch (ext) {
      case "gif":
      case "jpg":
      case "jpe":
      case "jpeg":
      case "png":
        icon = "image-o";
        break;
      case "pdf":
        icon = "pdf-o";
        break;
      case "doc":
      case "docx":
        icon = "word-o";
        break;
      case "xls":
      case "xlsx":
        icon = "excel-o";
        break;
      case "txt":
        icon = "text-o";
        break;
      case "ppt":
      case "pptx":
        icon = "powerpoint-o";
        break;
      case "zip":
      case "rar":
        icon = "archive-o";
        break;
      case "exe":
      case "css":
      case "js":
      case "html":
        icon = "code-o";
        break;
      default:
        icon = "o";
    }

    output =
      "<span class='fa fa-file-" +
      icon +
      "'></span>\
        <span class='k-filename' title='" +
      name +
      "'>" +
      name +
      "</span>";

    if (
      typeof path != "undefined" &&
      (!e.files || !e.files.length || !e.files[0].rawFile)
    ) {
      var browserExtensions = ["jpg", "jpeg", "png", "gif", "css", "js", "pdf"],
        href = !useController
          ? path + e.name
          : "/api/MAGIC_SAVEFILE/GetFile?path=" +
            encodeURIComponent(path + e.name) +
            (adminAreaUpload ? "&adminAreaUpload=true" : ""),
        attribute =
          browserExtensions.indexOf(ext) > -1 ? 'target="_blank"' : "download";

      if (typeof fileLinkOverrides != "undefined" && gridName && colName) {
        if (
          gridName in fileLinkOverrides &&
          colName in fileLinkOverrides[gridName]
        ) {
          href = "javascript:void(0)";
          attribute =
            ' onclick="' + fileLinkOverrides[gridName][colName] + '(event)"';
        }
      }

      output =
        '<a target="_blank" title="' +
        name +
        '" class="k-button k-button-icontext" href="/api/MAGIC_SAVEFILE/GetFile?path=' +
        path +
        e.name +
        '">';
      output += '<span class="fa fa-file-' + icon + '"></span></a>';

      //output = '<a title="' + name + '" href="' + href + '" ' + attribute + '>' + output + '</a>';
    }

    if (isKendoField) {
      output =
        "<span class='k-progress'></span>" +
        output +
        "<strong class='k-upload-status'>\
                <button type='button' class='k-button k-button-bare k-upload-action' style='min-width: 0;'>\
                    <span class='k-icon k-i-close k-delete' title='" +
        getObjectText("remove") +
        "'></span>\
                </button>\
            </strong>";
    }
  }

  return output;
}

function downloadLargeFile() {
  function getContentLength(url) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.send();
      xhr.onload = function() {
        resolve();
      };
      xhr.onerror = reject;
    });
  }

  getContentLength(
    "https://dev.reftree.it/api/MAGIC_SAVEFILE/GetFile?path=catastoB_CCCExport_20220909152231.zip"
  );
}

function downloadFileNoDocume(e) {
  var jsonpayload = {};

  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[e.id].jsonpayload);
  } catch (ee) {
    kendoConsole.log("jsonpayload is not a valid json:" + ee.message, true);
    return;
  }

  //config.MF.api
  //    .get({
  //        storedProcedureName: jsonpayload,
  //        ApplicationInstanceId: window.ApplicationInstanceId,
  //        data: {
  //            gridname: sourcegridname,
  //            id: sourceItemIds,
  //            idFloor: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].id : null,
  //        },
  //    })
  //    .then(
  //        function (result) {
  //            doModal(false)
  //            if (!result.length) {
  //                return;
  //            }

  //            $.each(result[0], function (i, v) {
  //                if (v.status == "OK") {
  //                    kendoConsole.log("Elaborazione effettuata attendere il file.", false);

  //                    $.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + v.pathFile.replace(FileUploadRootDir, ''));
  //                } else {
  //                    kendoConsole.log("Elaborazione non effettuata.", true);
  //                }
  //            });
  //        },
  //        function (err) {
  //            console.log(err);
  //            doModal(false)
  //        },
  //    );

  var entityGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var rows = entityGrid.select();
  if (rows.length == 0) {
    kendoConsole.log("Selezionare almeno un documento da scaricare", true);
    return;
  }
  var files = [];
  var rootDirForCustomer = "/api/MAGIC_SAVEFILE/GetFile?path=";

  rows.each(function(index, row) {
    var selectedItem = entityGrid.dataItem(row);

    try {
      if (
        selectedItem[jsonpayload.itemPath] != null &&
        selectedItem[jsonpayload.itemFileName] != null
      ) {
        var oPathFile = selectedItem[jsonpayload.itemPath];

        if (jsonpayload.isJson) {
          var oFile = JSON.parse(selectedItem[jsonpayload.itemFileName]);

          $.each(oFile, function(i, v) {
            var obj = {
              pathFile: "",
              fileName: "",
            };
            obj.pathFile = oPathFile;
            obj.fileName = v.name;
            files.push(obj);
          });
        } else {
          var obj = {
            pathFile: "",
            fileName: "",
          };
          obj.pathFile = oPathFile;
          obj.fileName = selectedItem[jsonpayload.itemFileName];
          files.push(obj);
        }
      }
    } catch (ex) {
      console.log(ex.message);
    }
  });

  var zip = new JSZip();
  var filesToAdd = [];
  var fileNotfound = "";

  doModal(true);

  try {
    $.each(files, function(i, p) {
      var isHtml =
        p.fileName
          .split(".")
          .pop()
          .toUpperCase() == "html".toUpperCase()
          ? true
          : false;

      $.ajax({
        url: rootDirForCustomer + p.pathFile + encodeURIComponent(p.fileName),
        cache: false,
        xhr: function() {
          var xhr = new XMLHttpRequest();
          if (!isHtml) {
            xhr.responseType = "arraybuffer";
          }
          return xhr;
        },
        success: function(res, status, xhr) {
          //se sono difronte ad un file .html lo trasformo in un arrayBuffer
          if (isHtml) {
            var enc = new TextEncoder(); // always utf-8
            res = enc.encode(res);
          }

          zip.file(p.fileName, res, { base64: true });

          filesToAdd.push(p);

          if (filesToAdd.length == files.length) {
            if (fileNotfound != "") {
              zip.file("file non trovati.txt", fileNotfound);
            }

            var content = zip.generate({}, onEndFileZip());

            kendo.saveAs({
              dataURI: "data:application/zip;base64," + content,
              fileName: new Date().getTime() + "-download.zip",
            });
          }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          fileNotfound += p.fileName + String.fromCharCode(10);

          files.splice(i, 1);

          if (filesToAdd.length == files.length) {
            zip.file("file non trovati.txt", fileNotfound);

            var content = zip.generate({}, onEndFileZip());

            kendo.saveAs({
              dataURI: "data:application/zip;base64," + content,
              fileName: new Date().getTime() + "-download.zip",
            });
          }

          console.log("file non caricato");
        },
      });
    });
  } catch (ex) {
    kendoConsole.log("Errrore: " & ex, true);
    doModal();
  }

    function onEndFileZip() {
        //aggiunto parametro nel playload per escludere la generazione del file excel
        if (!!jsonpayload.excludeXlsx) {
            if (!jsonpayload.excludeXlsx) {
                exportTofileForZip(e, "xlsx");
            }
        } else {
            exportTofileForZip(e, "xlsx");
        }

        
        doModal();
  }

  function exportTofileForZip(e, format, getObjectOnly) {
      let gridname = $(e)
          .closest(".k-grid")
          .attr("gridName");

      exportobject = window.HashOfExportableGrids[gridname];
      delete exportobject.entity;
      delete exportobject.jsonparam;
      exportobject.gridname = gridname;
      exportobject.functionID = getCurrentFunctionID();

      let grid = $(e)
          .closest(".k-grid")
          .data("kendoGrid");

      var thegridtoexportds = grid.dataSource;      
      var filter = thegridtoexportds.filter();
      var filterOld = thegridtoexportds.filter();

      var filterExcel = {
          "filters": [],
          "logic": "or"
      }

      //aggiunto parametro nel playload per considerare solo i file selezionati
      if (jsonpayload.filterItem) {
          var rows = grid.select();

          rows.each(function (index, row) {
              var selectedItem = grid.dataItem(row);
              filterExcel.filters.push(
                  { field: jsonpayload.filterItem, operator: "eq", value: selectedItem[jsonpayload.filterItem] }
              )
              console.log(selectedItem)
          })

          filter = filterExcel
      }
      
      if (filter) {
          filter = formatDateFilters(filter); //normalizzazione filtri su date.
      }

      exportobject.select = grid.columns
          .map(function (v) {
              if (v.field && v.field != null && v.field != "" && v.field != undefined)
                  return v.field;
          })
          .filter((x) => x);
      exportobject.columns = kendo.stringify(
          grid.columns.filter((c) => !c.hidden)
      );
      if (!format) exportobject.format = "csv";
      else exportobject.format = format;
      exportobject.filter = filter === undefined ? null : filter;

      exportobject.sort = grid.dataSource.sort();
      if (!exportobject.sort) {
          delete exportobject.sort;
      }

      if (getObjectOnly) {
          //exportobject.filter = filterOld;
          return exportobject;
      }
      document.cookie = "fileDownload=true";

      $.fileDownload("/api/GENERICSQLCOMMAND/ExportTofile/", {
          data: exportobject,
          httpMethod: "POST",
          prepareCallback: function (url) {
              console.log("prepareCallback");
          },
          successCallback: function (url) {
              console.log("prepareCallback");
          },
      });

      //exportobject.filter = filterOld;
  }
    }


function downloadFileNoDocumeSp(e) {
  var jsonpayload = {};
  var sStoredProcedure = "";

  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[e.id].jsonpayload);
    sStoredProcedure = toolbarbuttonattributes[e.id].storedprocedure;
  } catch (ee) {
    kendoConsole.log("jsonpayload is not a valid json:" + ee.message, true);
    return;
  }

  if (!!sStoredProcedure || sStoredProcedure == "") {
    kendoConsole.log("Procedura di estrazione non effettuata.", true);
    return;
  }

  config.MF.api
    .get({
      storedProcedureName: sStoredProcedure,
      ApplicationInstanceId: window.ApplicationInstanceId,
      data: {
        gridname: sourcegridname,
        id: sourceItemIds,
        idFloor:
          self.fileShownInDetail != ""
            ? self.fileInfo[self.fileShownInDetail].id
            : null,
      },
    })
    .then(
      function(result) {
        doModal(false);
        if (!result.length) {
          return;
        }

        $.each(result[0], function(i, v) {
          if (v.status == "OK") {
            kendoConsole.log(
              "Elaborazione effettuata attendere il file.",
              false
            );

            $.fileDownload(
              "/api/MAGIC_SAVEFILE/GetFile?path=" +
                v.pathFile.replace(FileUploadRootDir, "")
            );
          } else {
            kendoConsole.log("Elaborazione non effettuata.", true);
          }
        });
      },
      function(err) {
        console.log(err);
        doModal(false);
      }
    );

  var entityGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var rows = entityGrid.select();
  if (rows.length == 0) {
    kendoConsole.log("Selezionare almeno un documento da scaricare", true);
    return;
  }
  var files = [];
  var rootDirForCustomer = "/api/MAGIC_SAVEFILE/GetFile?path=";
  
  rows.each(function(index, row) {
    var selectedItem = entityGrid.dataItem(row);

    try {
      if (
        selectedItem[jsonpayload.itemPath] != null &&
        selectedItem[jsonpayload.itemFileName] != null
      ) {
        var oPathFile = selectedItem[jsonpayload.itemPath];

        if (jsonpayload.isJson) {
          var oFile = JSON.parse(selectedItem[jsonpayload.itemFileName]);

          $.each(oFile, function(i, v) {
            var obj = {
              pathFile: "",
              fileName: "",
            };
            obj.pathFile = oPathFile;
            obj.fileName = v.name;
            files.push(obj);
          });
        } else {
          var obj = {
            pathFile: "",
            fileName: "",
          };
          obj.pathFile = oPathFile;
          obj.fileName = selectedItem[jsonpayload.itemFileName];
          files.push(obj);
        }
      }
    } catch (ex) {
      console.log(ex.message);
    }
  });

  var zip = new JSZip();
  var filesToAdd = [];
  var fileNotfound = "";

  doModal(true);

  try {
    $.each(files, function(i, p) {
      var isHtml =
        p.fileName
          .split(".")
          .pop()
          .toUpperCase() == "html".toUpperCase()
          ? true
          : false;

      $.ajax({
        url: rootDirForCustomer + p.pathFile + encodeURIComponent(p.fileName),
        cache: false,
        xhr: function() {
          var xhr = new XMLHttpRequest();
          if (!isHtml) {
            xhr.responseType = "arraybuffer";
          }
          return xhr;
        },
        success: function(res, status, xhr) {
          //se sono difronte ad un file .html lo trasformo in un arrayBuffer
          if (isHtml) {
            var enc = new TextEncoder(); // always utf-8
            res = enc.encode(res);
          }

          zip.file(p.fileName, res, { base64: true });

          filesToAdd.push(p);

          if (filesToAdd.length == files.length) {
            if (fileNotfound != "") {
              zip.file("file non trovati.txt", fileNotfound);
            }

            var content = zip.generate({}, onEndFileZip());

            kendo.saveAs({
              dataURI: "data:application/zip;base64," + content,
              fileName: new Date().getTime() + "-download.zip",
            });
          }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          fileNotfound += p.fileName + String.fromCharCode(10);

          files.splice(i, 1);

          if (filesToAdd.length == files.length) {
            zip.file("file non trovati.txt", fileNotfound);

            var content = zip.generate({}, onEndFileZip());

            kendo.saveAs({
              dataURI: "data:application/zip;base64," + content,
              fileName: new Date().getTime() + "-download.zip",
            });
          }

          console.log("file non caricato");
        },
      });
    });
  } catch (ex) {
    kendoConsole.log("Errrore: " & ex, true);
    doModal();
  }

  function onEndFileZip() {
    exportTofileForZip(e, "xlsx");
    doModal();
  }

  function exportTofileForZip(e, format, getObjectOnly) {
    let gridname = $(e)
      .closest(".k-grid")
      .attr("gridName");
    exportobject = window.HashOfExportableGrids[gridname];
    delete exportobject.entity;
    delete exportobject.jsonparam;
    exportobject.gridname = gridname;
    exportobject.functionID = getCurrentFunctionID();

    let grid = $(e)
      .closest(".k-grid")
      .data("kendoGrid");
    var thegridtoexportds = grid.dataSource;
    var filter = thegridtoexportds.filter();
    if (filter) {
      filter = formatDateFilters(filter); //normalizzazione filtri su date.
    }
    exportobject.select = grid.columns
      .map(function(v) {
        if (v.field && v.field != null && v.field != "" && v.field != undefined)
          return v.field;
      })
      .filter((x) => x);
    exportobject.columns = kendo.stringify(
      grid.columns.filter((c) => !c.hidden)
    );
    if (!format) exportobject.format = "csv";
    else exportobject.format = format;
    exportobject.filter = filter === undefined ? null : filter;

    exportobject.sort = grid.dataSource.sort();
    if (!exportobject.sort) {
      delete exportobject.sort;
    }

    if (getObjectOnly) {
      return exportobject;
    }
    document.cookie = "fileDownload=true";

    $.fileDownload("/api/GENERICSQLCOMMAND/ExportTofile/", {
      data: exportobject,
      httpMethod: "POST",
      prepareCallback: function(url) {
        console.log("prepareCallback");
      },
      successCallback: function(url) {
        console.log("prepareCallback");
      },
    });
  }
}

function downloadFilesFromSp(e) {
  //require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
  //    require(["angular-dwg-viewer"], function (app) {

  //        console.log(app);

  //        //var app = angular.module('myApp', ['dxfViewer']);
  //        //app.controller('personCtrl', function ($scope, dxfViewer) {
  //        //    console.log(dxfViewer);
  //        //});

  //    });
  //});

  var data = $(e)
      .closest(".k-grid")
      .data(),
    grid = data.kendoGrid,
    sourcegridname = $(e)
      .closest(".k-grid")
      .attr("gridName"),
    sStoredProcedure = "",
    jsonpayload = {},
    rowsData = $.map(grid.select(), function(val) {
      return grid.dataItem(val);
    });

  if (rowsData.length == 0) {
    kendoConsole.log("Nessun record selezionato.", true);
    return;
  }

  sourceItemIds = $.map(rowsData, function(v, i) {
    return v.id;
  });

  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[e.id].jsonpayload);
    sStoredProcedure = jsonpayload.storedprocedure;
  } catch (ee) {
    kendoConsole.log("jsonpayload is not a valid json:" + ee.message, true);
    return;
  }

  if (sStoredProcedure == "") {
    kendoConsole.log("Procedura di estrazione non effettuata.", true);
    return;
  }

  requireConfigAndMore(["MagicSDK"], function(MF) {
    doModal(true);

    MF.api
      .get({
        storedProcedureName: sStoredProcedure,
        ApplicationInstanceId: window.ApplicationInstanceId,
        data: {
          gridname: sourcegridname,
          id: sourceItemIds,
          ApplicationInstanceId: window.ApplicationInstanceId,
        },
        models: rowsData,
      })
      .then(
        function(result) {
          doModal(false);
          if (!result.length) {
            kendoConsole.log(
              "Elaborazione non effettuata, nessun record elaborato.",
              true
            );
            return;
          }

          $.each(result[0], function(i, v) {
            if (v.status == "OK") {
              var a = $(
                `<a id="tmpDownload__1234" download href="/api/MAGIC_SAVEFILE/GetFile?path=${v.pathFile.replace(
                  FileUploadRootDir,
                  ""
                )}">prova</a>`
              );
              $("#appcontainer").append(a);
              document.getElementById("tmpDownload__1234").click();
              $("#tmpDownload__1234").remove();

              kendoConsole.log(
                "Elaborazione effettuata attendere il file.",
                false
              );

              //$.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + v.pathFile.replace(FileUploadRootDir, ''));
            } else {
              kendoConsole.log("Elaborazione non effettuata.", true);
            }
          });

          grid.dataSource.read();
          grid.refresh();
        },
        function(err) {
          console.log(err);
          doModal(false);
        }
      );
  });
}

function onUploadSelect(e) {
  if (typeof overrideOnUploadSelect == "function") {
    overrideOnUploadSelect(e);
    return;
  }
  $.each(e.files, function(k, file) {
    //D.T this has been commented beacuase it breaks all the applications relying in p7m upload generated from e.g docx models with a fixed name
    //if (e.files[k].extension !== '.p7m') {
    e.files[k].name =
      Date.now().toString() +
      "-" +
      e.files[k].name.replace(/&(#\d+|\w+);|[^\w\.-]/g, "");
    //}
  });
}

function changeStaLav(e) {
  getCurrentModelInEdit().ITR_STASTO_STALAV_CODICE = e.sender.value();
}

function callReportCerved(rowData) {
  rebuildGenericModal();
  $("#wndmodalContainer").modal("toggle");
  $("#executesave").click(function() {
    //double click prevention
    if ($("#executesave").attr("clicked")) return;
    $("#executesave").attr("clicked", true);

    console.log(rowData);
    var refereID = rowData.LE_REFERE_ID;
    var deferred = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function(MF) {
      doModal(true);
      MF.api
        .get({
          storedProcedureName: "cerved.USP_CallReportCerved",
          data: {
            LE_REFERE_ID: refereID,
            TIPDOC_CODE: "52006",
            CF: rowData.tax_code,
          },
        })
        .then(
          function(result) {
            deferred.resolve(result);
            console.log(result);
          },
          function(err) {
            console.log(err);
            deferred.reject();
            doModal(false);
          }
        );
    });
    $.when(deferred).then(function(MF) {
      if (MF.length > 0) {
        var obj = {
          DO_DOCFIL_DO_DOCUME_ID: 0,
          DO_DOCVER_LINK_FILE: "",
        };
        obj.DO_DOCFIL_DO_DOCUME_ID = MF[0][0].DO_DOCFIL_DO_DOCUME_ID;
        obj.DO_DOCVER_LINK_FILE = MF[0][0].DO_DOCVER_LINK_FILE;
        $.fileDownload("/api/Documentale/ViewFile/", {
          data: obj,
          httpMethod: "POST",
        });
        //refresch chiamante
        $('div[gridname="RM_VI_RIMACT_LIST"]')
          .data("kendoGrid")
          .dataSource.read();
        doModal(false);
      } else {
        kendoConsole.log("Errore nella produzione del file", "info");
        doModal(false);
      }
    });
    $("#wndmodalContainer").modal("hide");
  });
}

function createRliPrima(rowData, e) {

    rebuildGenericModal();

    var data = $(e)

        .closest(".k-grid")

        .data(),

        grid = data.kendoGrid;

    var gridName = grid.options.code;



    $("#wndmodalContainer").modal("toggle");

    $("#executesave").click(function () {

        //double click prevention

        if ($("#executesave").attr("clicked")) return;

        $("#executesave").attr("clicked", true);

        console.log(rowData);

        var veract = rowData.LE_VERACT_ID;

        var deferred = $.Deferred();

        requireConfigAndMore(["MagicSDK"], function (MF) {

            MF.api

                .get({

                    storedProcedureName: "core.USP_CreateRliPrima",

                    data: {

                        LE_VERACT_ID: veract,

                        LE_RTCONL_DATA_RICHIESTA: rowData.LE_RTCONL_DATA_RICHIESTA,

                    },

                })

                .then(

                    function (result) {

                        deferred.resolve(result);

                        console.log(result);

                    },

                    function (err) {

                        console.log(err);

                        deferred.reject();

                    }

                );

        });

        $.when(deferred).then(function (MF) {

            if (MF.length > 0) {

                var obj = {

                    DO_DOCFIL_DO_DOCUME_ID: 0,

                    DO_DOCVER_LINK_FILE: "",

                };

                obj.DO_DOCFIL_DO_DOCUME_ID = MF[0][0].DO_DOCFIL_DO_DOCUME_ID;

                obj.DO_DOCVER_LINK_FILE = MF[0][0].DO_DOCVER_LINK_FILE;

                $.fileDownload("/api/Documentale/ViewFile/", {

                    data: obj,

                    httpMethod: "POST",

                });

                //refresch chiamante

                $('div[gridname="' + gridName + '"]')

                    .data("kendoGrid")

                    .dataSource.read();

            } else kendoConsole.log("Errore nella produzione del file", "info");

        });

        $("#wndmodalContainer").modal("hide");

    });

}

function DownloadAuthDocument(TipDocCode) {
    var deferred = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api
            .get({
                storedProcedureName: "core.SR_USP_GestAuthData",
                data: {
                    tidocCode: TipDocCode,
                },
            })
            .then(
                function (result) {
                    deferred.resolve(result);
                    console.log(result);
                },
                function (err) {
                    console.log(err);
                }
            );
    });

    $.when(deferred).then(function (MF) {
        if (MF.length > 0) {
            var obj = {
                DO_DOCFIL_DO_DOCUME_ID: 0,
                DO_DOCVER_LINK_FILE: "",
            };
            obj.DO_DOCFIL_DO_DOCUME_ID = MF[0][0].DO_DOCUME_ID;
            obj.DO_DOCVER_LINK_FILE = MF[0][0].DO_DOCVER_LINK_FILE;
            $.fileDownload("/api/Documentale/ViewFile/", {
                data: obj,
                httpMethod: "POST",
            });
        } else kendoConsole.log("Errore nel recupero dei casi d''uso", "info");
    });
}
function DownloadPolicy() {


  var deferred = $.Deferred();
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: "core.SR_USP_GestAuthData",
        data: {
          tidocCode: "SR_AUTH",
        },
      })
      .then(
        function(result) {
          deferred.resolve(result);
          console.log(result);
        },
        function(err) {
          console.log(err);
        }
      );
  });

  $.when(deferred).then(function(MF) {
    if (MF.length > 0) {
      var obj = {
        DO_DOCFIL_DO_DOCUME_ID: 0,
        DO_DOCVER_LINK_FILE: "",
      };
      obj.DO_DOCFIL_DO_DOCUME_ID = MF[0][0].DO_DOCUME_ID;
      obj.DO_DOCVER_LINK_FILE = MF[0][0].DO_DOCVER_LINK_FILE;
      $.fileDownload("/api/Documentale/ViewFile/", {
        data: obj,
        httpMethod: "POST",
      });
    } else kendoConsole.log("Errore nel recupero dei casi d''uso", "info");
  });
}

function saveConfirmReadPolicy() {


  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: "core.SR_USP_SetAuthData",
        data: {
          tidocCode: "SR_AUTH",
        },
      })
      .then(
        function(result) {
       
          console.log(result);
        },
        function(err) {
          console.log(err);
        }
      );
  });


}

//help on line cei
function helpDownloadFile(event, tipdocCode) {
  event.preventDefault();
  console.log("passoHelp");

  var deferred = $.Deferred();
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: "custom.USP_Get_HelpOnLine",
        data: {
          tidocCode: tipdocCode,
        },
      })
      .then(
        function(result) {
          deferred.resolve(result);
          console.log(result);
        },
        function(err) {
          console.log(err);
        }
      );
  });

  $.when(deferred).then(function(MF) {
    if (MF.length > 0) {
      var obj = {
        DO_DOCFIL_DO_DOCUME_ID: 0,
        DO_DOCVER_LINK_FILE: "",
      };
      obj.DO_DOCFIL_DO_DOCUME_ID = MF[0][0].DO_DOCFIL_DO_DOCUME_ID;
      obj.DO_DOCVER_LINK_FILE = MF[0][0].DO_DOCVER_LINK_FILE;
      $.fileDownload("/api/Documentale/ViewFile/", {
        data: obj,
        httpMethod: "POST",
      });
    } else kendoConsole.log("Errore nel recupero dei casi d''uso", "info");
  });
}

function searchGridTypeField(container, options) {
  options.model.set(
    "TK_PRICEU_DESCRIPTION",
    options.model.TK_PRICEU_DESCRIPTION
  );
}

function launchActionJsFunctionSchedaWF(rowData, grid) {
  /**
   * La funzione riceve il rowData nel quale si aspetta di trovare il parametro
   *      params: un array ordinato dei parametri da passare alla funzione
   */
  jsonInfo = JSON.parse(rowData.jsonInfo);

  taskId = jsonInfo.taskId;
  activityId = jsonInfo.activityId;
  activityreport(taskId, activityId);
}

function openHelpHtml(e, file, download) {
  if (download) {
    e.closest("a").href =
      "/api/MAGIC_SAVEFILE/GetFile?path=" +
      //window.FileUploadRootDir.replace('TempUpload', '') +
      file;
  } else {
    window.open(
      window.origin +
        "/api/MAGIC_SAVEFILE/GetFile?path=" +
        //window.FileUploadRootDir.replace('TempUpload', '') +
        file
    );
  }
}

function openEnergies(e, options) {
  var jsonpayload = {};
  try {
    jsonpayload = JSON.parse(
      toolbarbuttonattributes[$(e).attr("id")].jsonpayload
    );
  } catch (e) {
    console.log("jsonpayload is not a valid json:" + e.message);
  }

  window.open(jsonpayload.url, "_blank");
}

function openEnergies2(e, options) {
  var jsonpayload = {};
  try {
    jsonpayload = getRowJSONPayload(e);
  } catch (e) {
    console.log("jsonpayload is not a valid json:" + e.message);
  }

  window.open(
    "https://beta.energis.cloud/energiscloud/pages/#/view-dashboards/203",
    "_blank"
  );
}

function openEnergies3(e, options) {
  var jsonpayload = {};
  try {
    jsonpayload = getRowJSONPayload(e);
  } catch (e) {
    console.log("jsonpayload is not a valid json:" + e.message);
  }

  window.open(
    "https://ec2-52-17-61-36.eu-west-1.compute.amazonaws.com:8443/player/#/auth/login",
    "_blank"
  );

  //window.open({
  //    "url": "https://ec2-52-17-61-36.eu-west-1.compute.amazonaws.com:8443/player/#/auth/login"
  //}, '_blank');
}

function showGridDwgR3(buttonEl) {
  var data = $(buttonEl)
      .closest(".k-grid")
      .data(),
    grid = data.kendoGrid,
    userSessionManagementSp = window.userSessionManagementSp
      ? window.userSessionManagementSp
      : "core.DWG_ManageFilterForUser",
    dwgController = $("#grid-dwg-controller"),
    config;

  $(".page-title")
    .find('a[href="javascript:history.back()"]')
    .hide();
  var dwgCadInfo = {};

  //if (!grid) {
  //    kendoConsole.log(getObjectText('selectatleastone'), true);
  //    return;
  //}

  if (!grid.select().length) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }

  var rowData = grid.dataItem(grid.select()[0]);

  if (dwgController.length) {
    kendo.destroy(".re-gd-viewer");
    dwgController.remove();
  }
  var deferred = $.Deferred();

  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: userSessionManagementSp,
        data: { useraction: "init" },
      })
      .then(
        function(result) {
          MF.api
            .get({
                storedProcedureName: "core.DWG_Cad_config",
                gridName: grid.options.code,
                data: { ApplicationInstanceId: window.ApplicationInstanceId },

            })
            .then(
              function(result) {
                try {
                  dwgCadInfo = JSON.parse(result[0][0].RSN_CADCFG_JSON_CONFIG);
                  deferred.resolve(MF);
                } catch (ex) {
                  kendoConsole.log(
                    getObjectText("Errore configurazione cad config"),
                    true
                  );
                  return;
                }
              },
              function(err) {
                console.log(err);
              }
            );
        },
        function(err) {
          console.log(err);
        }
      );
  });

  $.when(deferred).then(function(MF) {
    $("html, body").animate({ scrollTop: 0 }, "slow");

    config = {
      MF: MF,
      id: "dwg_" + grid.element.attr("gridname"),
      userSessionManagementSp: userSessionManagementSp,
      grid: grid,
      serviceUrl: dwgCadInfo.serviceUrl,
      serviceUrlInterface: dwgCadInfo.serviceUrlInterface,
      rootForDxf: dwgCadInfo.rootForDxf,
      dwgCadInfo: dwgCadInfo,
      ready: function() {
        var interval = setInterval(function() {
          var fadeout = dwgController.find(".fadeout");
          if (fadeout.length > 0) {
            clearInterval(interval);
            $("#grid-dwg-controller-spinner").remove();
            fadeout.addClass("fadein");
          }
        }, 100);
      },

      // dwgFilename: "636167041781167492_02 Pianta Piano S1.dwg",
      serviceUrl:
        "http://ref2space.idearespa.com/TeighaService5/teighaservice.svc/webhttp/",
      serviceUrlInterface:
        "http://ref2space.idearespa.com/TeighaService5/teighaservice.svc/webhttp/js",
    };

    //temporary workaround to change pointers to services based on appid
    /*
                if (window.ApplicationInstanceId = 3101) //UNIGE
                {
                    config.serviceUrl = "http://ref2space.idearespa.com/teighaservicenewunige/teighaservice.svc/webhttp/";
                    config.serviceUrlInterface = "http://ref2space.idearespa.com/teighaservicenewunige/teighaservice.svc/webhttp/js"
                }
                */

    // var $dxf = $('<div>').insertBefore("#appcontainer");
    // initReact($dxf, 'dxf');

    if (
      !!rowData.start_viewer_by_handle &&
      rowData.start_viewer_by_handle == 1
    ) {
      //config.features = {
      //  map: false,
      //  sidebarAccordion: false,
      //  closeButton: false,
      //};
      //var oDwg = {};
      //var oAllFile = [];
      //oDwg.files = [];

      //$.each(grid.select(), function(i, obj) {
      //  if (!!grid.dataItem(grid.select()[i]).filename) {
      //    oAllFile.push(grid.dataItem(grid.select()[i]).filename);
      //  }
      //});

      //oAllFile = oAllFile.filter(function(v, i) {
      //  return oAllFile.indexOf(v) == i;
      //});

      //$.each(oAllFile, function(i, v) {
      //  var polylines = [];
      //    var tooltip = [];
      //  $.map(grid.select(), function(obj) {
      //      var handles = [];

      //    if ((grid.dataItem(obj).filename = v)) {
      //      var harrHandle = grid.dataItem(obj).HANDLE.split(',');
      //      $.each(harrHandle, function(i, v) {
      //          handles.push(v);

      //        polylines.push({
      //            handles: [v.split(';')[0]],
      //            color: v.split(';')[1] === undefined ? '#FF0000' : v.split(';')[1],
      //          });

      //          tooltip.push({
      //              handles: v.split(';')[0],
      //              tooltip: v.split(';')[2] === undefined ? '' : v.split(';')[2],
      //          });

      //      });

      //      //color = grid.dataItem(obj).color
      //      //  ? grid.dataItem(obj).color
      //      //  : '#FF0000';
      //      //tooltip = grid.dataItem(obj).handle_tooltip
      //      //  ? grid.dataItem(obj).handle_tooltip
      //      //  : '';
      //    }

      //    //handles = handles.filter(function (v, i) { return handles.indexOf(v) == i; });
      //  });

      //  oDwg.files.push({ name: v, polylines: polylines, tooltip: tooltip });
      //  });

      config.features = {
        map: false,
        sidebarAccordion: false,
        closeButton: false,
      };

      var oDwg = {};
      var oAllFile = [];
      oDwg.files = [];
      var oRowSelected = [];

      $.each(grid.select(), function(i, obj) {
        oRowSelected.push(grid.dataItem(obj));
        if (!!grid.dataItem(grid.select()[i]).filename) {
          oAllFile.push(grid.dataItem(grid.select()[i]).filename);
        }
      });

      oAllFile = oAllFile.filter(function(v, i) {
        return oAllFile.indexOf(v) == i;
      });

      $.each(oAllFile, function(i, v) {
        var rowGrid = [];

        oRowSelected
          .filter(function(row) {
            if (row.filename == v) {
              return row;
            }
          })
          .map(function(row) {
            var harrHandle = row.HANDLE.split(",");
            $.each(harrHandle, function(ii, vv) {
              rowGrid.push({
                handle: vv.split(";")[0],
                color: vv.split(";")[1],
                tooltip: vv.split(";")[2],
                checked: true,
              });
            });
          });
        oDwg.files.push({ name: v, rowGrid: rowGrid, polylines: [] });
      });

      if (oDwg.files.length > 0) {
        config.fileDwg = oDwg;
        config.modalId = "dwgHandleController";
        config.rowData = rowData;

        showModalCustomR3(
          {
            title: '<i aria-hidden="true"></i>',
            wide: true,
            backdrop: false,
            content: getAngularControllerElement("dwgHandleController", config),
            onClose: function() {
              //$("#wndmodalContainer-r3").remove();
              $("#" + config.modalId).remove();
              if ($("#wndmodalContainer-r3").length > 0) {
                $("#wndmodalContainer-r3").css({ display: "inline" });

                if (angular.element($("tree-view-r3")).length > 0) {
                  angular.element($("tree-view-r3")).scope().t.onRefresh = true;
                  angular
                    .element($("tree-view-r3"))
                    .scope()
                    .t.loadHtmlForm(
                      angular.element($("tree-view-r3")).scope().t.selectedNode
                        .htmlPage
                    );

                  var myModal = $(
                    "#" + angular.element($("tree-view-r3")).scope().t.modalId
                  );

                  if (myModal.length > 0) {
                    myModal.css({ display: "inline" });
                  }
                }
              }
            },
            modalId: config.modalId,
          },
          true
        );
      } else {
        kendoConsole.log("Record non presente in planimetria", true);
        if ($("#wndmodalContainer-r3").length > 0) {
          $("#wndmodalContainer-r3").css({ display: "inline" });

          if (angular.element($("tree-view-r3")).length > 0) {
            angular.element($("tree-view-r3")).scope().t.onRefresh = true;
            angular
              .element($("tree-view-r3"))
              .scope()
              .t.loadHtmlForm(
                angular.element($("tree-view-r3")).scope().t.selectedNode
                  .htmlPage
              );

            var myModal = $(
              "#" + angular.element($("tree-view-r3")).scope().t.modalId
            );

            if (myModal.length > 0) {
              myModal.css({ display: "inline" });
            }
          }
        }
      }

      // window.open(window.origin + '/views/3/dxf-viewer.aspx?q=' + encodeURIComponent(rowData.JSON_FOR_DWG), '' , "width=500,height=500");
    } else {
      var controllerName = "ReftreeGridViewerController";
      //var controllerName = "ReftreeGridViewerNewController";
      dwgController = $(
        '<div id="grid-dwg-controller" style="position: relative">'
      )
        .append(
          $(getAngularControllerElement(controllerName, config))
            .css("height", "100%")
            .addClass("fadeout")
        )
        .css("height", "100vh");

      dwgController
        .append(
          '<div id="grid-dwg-controller-spinner" style="position: absolute; left: 50%; top: 40%">' +
            largeSpinnerHTML +
            "</div>"
        )
        .insertBefore("#appcontainer");
    }

    // $("#appcontainer").css('display', 'none');

    dwgController.removeData();
    dwgController.data("dwgConfig", config);
    $.each(data, function(k, v) {
      dwgController.data(k, v);
    });
  });
}

function showGridDwgR3RowHead(buttonEl) {
  var data,
    userSessionManagementSp = window.userSessionManagementSp
      ? window.userSessionManagementSp
      : "core.DWG_ManageFilterForUser",
    dwgController = $("#grid-dwg-controller"),
    config,
    rowHead = false,
    dwgCadInfo = {};

  //provengo da un bottone rowhead
  if (buttonEl.currentTarget) {
    rowHead = true;
    data = $(buttonEl.currentTarget)
      .closest(".k-grid")
      .data();
  } else {
    data = $(buttonEl)
      .closest(".k-grid")
      .data();
  }

  grid = data.kendoGrid;

  $(".page-title")
    .find('a[href="javascript:history.back()"]')
    .hide();

  //var selectedRow = rowHead ? getRowDataFromButton(buttonEl) : grid.dataItem(grid.select()[0]);
  if (!rowHead) {
    if (!grid.select().length) {
      kendoConsole.log(getObjectText("selectatleastone"), true);
      return;
    }
  }

  var rowData = rowHead
    ? getRowDataFromButton(buttonEl)
    : grid.dataItem(grid.select()[0]);

  if (dwgController.length) {
    kendo.destroy(".re-gd-viewer");
    dwgController.remove();
  }
  var deferred = $.Deferred();

  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: userSessionManagementSp,
        data: { useraction: "init" },
      })
      .then(
        function(result) {
          MF.api
            .get({
              storedProcedureName: "core.DWG_Cad_config",
              data: { ApplicationInstanceId: window.ApplicationInstanceId },
            })
            .then(
              function(result) {
                try {
                  dwgCadInfo = JSON.parse(result[0][0].RSN_CADCFG_JSON_CONFIG);
                  deferred.resolve(MF);
                } catch (ex) {
                  kendoConsole.log(
                    getObjectText("Errore configurazione cad config"),
                    true
                  );
                  return;
                }
              },
              function(err) {
                console.log(err);
              }
            );
        },
        function(err) {
          console.log(err);
        }
      );
  });

  $.when(deferred).then(function(MF) {
    $("html, body").animate({ scrollTop: 0 }, "slow");

    config = {
      MF: MF,
      id: "dwg_" + grid.element.attr("gridname"),
      userSessionManagementSp: userSessionManagementSp,
      grid: grid,
      serviceUrl: dwgCadInfo.serviceUrl,
      serviceUrlInterface: dwgCadInfo.serviceUrlInterface,
      rootForDxf: dwgCadInfo.rootForDxf,
      dwgCadInfo: dwgCadInfo,
      ready: function() {
        var interval = setInterval(function() {
          var fadeout = dwgController.find(".fadeout");
          if (fadeout.length > 0) {
            clearInterval(interval);
            $("#grid-dwg-controller-spinner").remove();
            fadeout.addClass("fadein");
          }
        }, 100);
      },

      serviceUrl:
        "http://ref2space.idearespa.com/TeighaService5/teighaservice.svc/webhttp/",
      serviceUrlInterface:
        "http://ref2space.idearespa.com/TeighaService5/teighaservice.svc/webhttp/js",
    };

    if (
      !!rowData.start_viewer_by_handle &&
      rowData.start_viewer_by_handle == 1
    ) {
      config.features = {
        map: false,
        sidebarAccordion: false,
        closeButton: false,
      };

      var oDwg = {},
        oAllFile = [],
        oRowSelected = [];

      oDwg.files = [];

      if (rowHead) {
        oRowSelected = [rowData];
        oAllFile.push(rowData.filename);
      } else {
        $.each(grid.select(), function(i, obj) {
          oRowSelected.push(grid.dataItem(obj));
          if (!!grid.dataItem(grid.select()[i]).filename) {
            oAllFile.push(grid.dataItem(grid.select()[i]).filename);
          }
        });
      }

      oAllFile = oAllFile.filter(function(v, i) {
        return oAllFile.indexOf(v) == i;
      });

      //$.each(oAllFile, function(i, v) {
      //  var rowGrid = [];

      //  oRowSelected
      //    .filter(function(row) {
      //      if (row.filename == v) {
      //        return row;
      //      }
      //    })
      //    .map(function(row) {
      //      var harrHandle = row.HANDLE.split(",");
      //      $.each(harrHandle, function(ii, vv) {
      //        rowGrid.push({
      //          handle: vv.split(";")[0],
      //          color: vv.split(";")[1],
      //          tooltip: vv.split(";")[2],
      //          checked: true,
      //        });
      //      });
      //    });
      //  oDwg.files.push({ name: v, rowGrid: rowGrid, polylines: [] });
      //});

      $.each(oAllFile, function(i, v) {
        var rowGrid = [];
        var allPolilyne = {};
        var tooltip = [];
        var polylines = [];

        oRowSelected
          .filter(function(row) {
            if (row.filename == v) {
              return row;
            }
          })
          .map(function(row) {
            if (row.HANDLE != "") {
              rowGrid.push({
                handle: row.HANDLE,
                color: row.color ? row.color : "#FF0000",
                tooltip: row.handle_tooltip ? row.handle_tooltip : "",
                checked: true,
              });
            }
          });

        oDwg.files.push({ name: v, rowGrid: rowGrid, polylines: [] });
      });

      if (oDwg.files.length > 0) {
        config.fileDwg = oDwg;
        config.modalId = "dwgHandleController";
        config.rowData = rowData;

        showModalCustomR3(
          {
            title: '<i aria-hidden="true"></i>',
            wide: true,
            backdrop: false,
            content: getAngularControllerElement("dwgHandleController", config),
            onClose: function() {
              //$("#wndmodalContainer-r3").remove();
              $("#" + config.modalId).remove();
              if ($("#wndmodalContainer-r3").length > 0) {
                $("#wndmodalContainer-r3").css({ display: "inline" });

                if (angular.element($("tree-view-r3")).length > 0) {
                  angular.element($("tree-view-r3")).scope().t.onRefresh = true;
                  angular
                    .element($("tree-view-r3"))
                    .scope()
                    .t.loadHtmlForm(
                      angular.element($("tree-view-r3")).scope().t.selectedNode
                        .htmlPage
                    );

                  var myModal = $(
                    "#" + angular.element($("tree-view-r3")).scope().t.modalId
                  );

                  if (myModal.length > 0) {
                    myModal.css({ display: "inline" });
                  }
                }
              }
            },
            modalId: config.modalId,
          },
          true
        );
      } else {
        kendoConsole.log("Record non presente in planimetria", true);
        if ($("#wndmodalContainer-r3").length > 0) {
          $("#wndmodalContainer-r3").css({ display: "inline" });

          if (angular.element($("tree-view-r3")).length > 0) {
            angular.element($("tree-view-r3")).scope().t.onRefresh = true;
            angular
              .element($("tree-view-r3"))
              .scope()
              .t.loadHtmlForm(
                angular.element($("tree-view-r3")).scope().t.selectedNode
                  .htmlPage
              );

            var myModal = $(
              "#" + angular.element($("tree-view-r3")).scope().t.modalId
            );

            if (myModal.length > 0) {
              myModal.css({ display: "inline" });
            }
          }
        }
      }

      // window.open(window.origin + '/views/3/dxf-viewer.aspx?q=' + encodeURIComponent(rowData.JSON_FOR_DWG), '' , "width=500,height=500");
    } else {
      var controllerName = "ReftreeGridViewerController";
      dwgController = $(
        '<div id="grid-dwg-controller" style="position: relative">'
      )
        .append(
          $(getAngularControllerElement(controllerName, config))
            .css("height", "100%")
            .addClass("fadeout")
        )
        .css("height", "100vh");

      dwgController
        .append(
          '<div id="grid-dwg-controller-spinner" style="position: absolute; left: 50%; top: 40%">' +
            largeSpinnerHTML +
            "</div>"
        )
        .insertBefore("#appcontainer");
    }

    // $("#appcontainer").css('display', 'none');

    dwgController.removeData();
    dwgController.data("dwgConfig", config);
    $.each(data, function(k, v) {
      dwgController.data(k, v);
    });
  });
}

function showPortalR3(buttonEl) {
  var data = $(buttonEl)
      .closest(".k-grid")
      .data(),
    grid = data.kendoGrid,
    portalController = $("#grid-portal-controller"),
    config;

  $(".page-title")
    .find('a[href="javascript:history.back()"]')
    .hide();

  if (!grid.select().length) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }

  var rowData = grid.dataItem(grid.select()[0]);

  config = {
    id: "dwg_" + grid.element.attr("gridname"),
    grid: grid,
    rowData: rowData,
    ready: function() {
      var interval = setInterval(function() {
        var fadeout = portalController.find(".fadeout");
        if (fadeout.length > 0) {
          clearInterval(interval);
          fadeout.addClass("fadein");
        }
      }, 100);
    },
  };

  config.modalId = "portalController";
  config.rowData = rowData;

  getAngularControllerElement("ReftreePortalViewerController", config);

  //showModalCustomR3(
  //    {
  //        title: '<i aria-hidden="true"></i>',
  //        wide: true,
  //        backdrop: false,
  //        content: getAngularControllerElement("ReftreePortalViewerController", config),
  //        onClose: function () {
  //            //$("#wndmodalContainer-r3").remove();
  //            $("#" + config.modalId).remove();
  //            if ($("#wndmodalContainer-r3").length > 0) {
  //                $("#wndmodalContainer-r3").css({ display: "inline" });
  //            }
  //        },
  //        modalId: config.modalId,
  //    },
  //    true
  //);

  return;
}

function showcaseR3(buttonEl) {
    var data = $(buttonEl)
        .closest(".k-grid")
        .data(),
        grid = data.kendoGrid,
        portalController = $("#grid-showcase-controller"),
        config;

    $(".page-title")
        .find('a[href="javascript:history.back()"]')
        .hide();

    if (!grid.select().length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }

    var rowData = grid.dataItem(grid.select()[0]);

    config = {
        id: "dwg_" + grid.element.attr("gridname"),
        grid: grid,
        rowData: rowData,
        ready: function () {
            var interval = setInterval(function () {
                var fadeout = portalController.find(".fadeout");
                if (fadeout.length > 0) {
                    clearInterval(interval);
                    fadeout.addClass("fadein");
                }
            }, 100);
        },
    };

    config.modalId = "showcaseController";
    config.rowData = rowData;

    getAngularControllerElement("ReftreeShowcaseViewerController", config);

    return;
}

function adhoxController(buttonEl) {
  var controllerNameHtml = "reftree-bim-viewer-controller";
  var controllerName = "ReftreeBimViewerController";

  var data = $(buttonEl)
      .closest(".k-grid")
      .data(),
    grid = data.kendoGrid,
    adhoxController = $("#" + controllerNameHtml),
    config;
  if (!grid.select().length) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }

  if (adhoxController.length) {
    adhoxController.remove();
  }

  var deferred = $.Deferred();
  var bimInfo = {};
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: userSessionManagementSp,
        data: { useraction: "init" },
      })
      .then(
        function(result) {
          MF.api
            .get({
              storedProcedureName: "core.BIM_Get_Bim_config",
              data: { ApplicationInstanceId: window.ApplicationInstanceId },
            })
            .then(
              function(result) {
                try {
                  bimInfo = JSON.parse(result[0][0].jsonConfig);
                  deferred.resolve(MF);
                } catch (ex) {
                  kendoConsole.log(
                    getObjectText("Errore configurazione cad config"),
                    true
                  );
                  return;
                }
              },
              function(err) {
                console.log(err);
              }
            );
        },
        function(err) {
          console.log(err);
        }
      );
  });

  $.when(deferred).then(function(MF) {
    config = {
      id: "adhox_" + grid.element.attr("gridname"),
      grid: grid,
      bimInfo: bimInfo,
      selectedItems: $.map(grid.select(), function(x) {
        return grid.dataItem(x);
      }),
      ready: function() {
        var interval = setInterval(function() {
          var fadeout = $("#" + controllerNameHtml).find(".fadeout");
          if (fadeout.length > 0) {
            clearInterval(interval);
            $("#" + controllerNameHtml + "-spinner").remove();
            fadeout.addClass("fadein");
          }
        }, 100);
      },
      close: function() {
        console.log(config);
      },
    };

    $(getAngularControllerElement(controllerName, config));
    //adhoxViewerController = $('<div id="' + controllerNameHtml + '" class="k-grid" style="position: relative">')
    //    .append($(getAngularControllerElement(controllerName, config)).css("height", "100%").addClass("fadeout"))
    //    .css("height", "80vh");
  });
}

function checkWizardButton(e) {
  var wizardID = e.models.ID;
  var modelGrid = $("div[gridname='SR_CURRENT_SUPPLIER_REGISTRATION']")
    .data("kendoGrid")
    .dataSource.data();

  var stage = modelGrid.filter(function(itm) {
    // return caller rec
    return itm.SR_SUPREG_ID == wizardID;
  });
  //remove button ...
  if (stage[0].SR_SUPREG_VALID_REQUEST_DATE) {
    $("button[title='Salva']").remove();
    $("a[.k-grid-add]").remove();
  }
}

function wizardOnRender(e) {
  var data = {
    SR_SUPREG_ID: e.models.ID,
  };
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api
      .get({
        storedProcedureName: "custom.USP_Get_MandDoc",
        data,
      })
      .then(
        function(result) {
          // deferred.resolve(result);
          console.log(result);
        },
        function(err) {
          console.log(err);
        }
      );
  });
}

function refreshChimanteR3(e) {
  //return;

  var $parentGridRow = e.wrapper.closest("tr.k-detail-row").prev("tr");
  var $parentGrid = $parentGridRow.closest(".k-grid");
  var parentGrid = $parentGridRow.closest("[data-role=grid]").data("kendoGrid");

  if (!parentGrid.dataSource.options.schema.model.id) {
    console.error("no id defined for parent grid - cannot update parent grid");
    return;
  }
  var dataSource = new kendo.data.DataSource(parentGrid.dataSource.options),
    dataItem = parentGrid.dataItem($parentGridRow);

  dataSource
    .query({
      filter: {
        field: parentGrid.dataSource.options.schema.model.id,
        operator: "eq",
        value: dataItem[parentGrid.dataSource.options.schema.model.id],
      },
    })
    .then(function(e) {
      if (dataSource.data().length == 0) {
        parentGrid.dataSource.remove(dataItem);
        return;
      }
      var newDataItem = dataSource.data()[0],
        $selectedTab = $parentGridRow
          .next()
          .find(".k-tabstrip div.k-content.k-state-active"),
        selectedTabIndex = $parentGridRow
          .next()
          .find(".k-tabstrip div.k-content")
          .index($selectedTab),
        parentRowIndex = $parentGridRow[0].rowIndex,
        guidIdRow = $parentGridRow.attr("data-uid");
      defaultEditable = dataItem.editable;
      dataItem.editable = function() {
        return true;
      };
      $.each(parentGrid.dataSource.options.schema.model.fields, function(k, v) {
        dataItem.set(k, newDataItem[k]);
        dataItem.dirty = false; //Added D.T: Bug #3518 prevents double saving when updating / inserting another row
      });
      //D.T" Bug #3357 reload once after a cancel changes is performed in parent grid (prevents from loosing modifications previously made)
      $parentGrid.data("kendoGrid").one("cancel", function(e) {
        e.sender.dataSource.read();
      });

      dataItem.editable = defaultEditable;

      //$parentGridRow = $(">.k-grid-content>table>tbody>tr", $parentGrid).eq(parentRowIndex);
      $parentGridRow = $(
        '>.k-grid-content>table>tbody>tr[data-uid="' + guidIdRow + '"]',
        $parentGrid
      );
      $parentGridRow.find(".k-hierarchy-cell .k-plus").click();

      var tabStrip = $parentGridRow
        .next()
        .find(".k-tabstrip")
        .data("kendoTabStrip");

      setTimeout(function() {
        try {
          tabStrip.select(selectedTabIndex);
        } catch (ex) {
          console.log(ex);
        }
      }, 1000);

      tabStrip.one("activate", function() {
        tabStrip.select(selectedTabIndex);
      });
    });
}

function checkGridHasAtLeastSor(form, i, scope) {
  var stepKey = scope.settings.steps[i].stepKey;

  var $stepkey = $("div[data-step-key=" + stepKey + "]");
  var data;

  //mandatory doc & depended field
  if (stepKey == "SR_SUPREG_01") {
    data = {
      LE_REFERE_ID: scope.models.SR_SUPREG_01.LE_REFERE_ID,
      SR_SUPREG_ID: scope.models.ID,
      SR_DATE_START: scope.models.SR_SUPREG_01.LE_REFERE_DATE_START_ACTIVITY,
      LE_REFERE_LE_TIPREF_ID: scope.models.SR_SUPREG_01.LE_REFERE_LE_TIPREF_ID,
    };
  }

  if (stepKey == "SR_SUPREG_03") {
    if (scope.models.SR_SUPREG_03.SR_CORP_COMP_GRID)
      data = {
        SR_CORP_COMP_GRID: scope.models.SR_SUPREG_03.SR_CORP_COMP_GRID,
        LE_REFERE_ID: scope.models.SR_SUPREG_01.LE_REFERE_ID,
        SR_SUPREG_ID: scope.models.ID,
        LE_REFERE_LE_TIPREF_ID:
          scope.models.SR_SUPREG_01.LE_REFERE_LE_TIPREF_ID,
      };
  }

  if (data && data != undefined && data != null && data.SR_SUPREG_ID)
    requireConfigAndMore(["MagicSDK"], function(MF) {
      MF.api
        .get({
          storedProcedureName: "custom.SR_USP_Get_Mandatory",
          data,
        })
        .then(
          function(result) {
            // deferred.resolve(result);
            console.log(result);

            if (result) scope.PF = result[0][0].PF;
          },
          function(err) {
            console.log(err);
          }
        );
    });

  if (stepKey == "SR_SUPREG3_N") {
    if (
      scope.PF === undefined &&
      scope.models.SR_SUPREG_01.SR_LE_TIREF_CODE &&
      scope.models.SR_SUPREG_01.SR_LE_TIREF_CODE === "PERFIS"
    )
      return true;

    if (scope.PF) return true;

    var datRevenue = $("div[gridname='SR_VI_CAPECO_LIST']")
      .data("kendoGrid")
      .dataSource.data();

    var err = "";

    var dataTec = $("div[gridname='SR_CAPTEC_L']")
      .data("kendoGrid")
      .dataSource.data();

    datRevenue.forEach(function(ele, i, arr) {
      console.log(ele);
      if (ele.SR_CAPETE_REVENUE == null || ele.SR_CAPETE_REVENUE === 0) {
        if (arr.length > 1)
          err =
            "Attenzione! Completare i dati relativi alla capacità economica indicando il fatturato per ciascuno degli anni indicati";
        else
          err =
            "Attenzione! Completare il dato relativo alla capacità economica indicando il fatturato per l'anno " +
            ele.Anno;
        return;
      }
    });

    if (!err.length && datRevenue.length > dataTec.length) {
      if (datRevenue.length > 1)
        err =
          "Attenzione! Completare i dati relativi alla capacità tecnica indicando almeno " +
          datRevenue.length +
          " principali incarichi assolti";
      else
        err =
          "Attenzione! Completare i dati relativi alla capacità tecnica indicando il principale incarico assolto";
    }

    if (err.length) {
      kendoConsole.log(err, "error");
      return false;
    }
  }

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };

  if (stepKey == "SR_SUPREG_1BIS") {
    var err;

    var classi = $("div[gridname='TK_V_CROSS_REFCSE']")
      .data("kendoGrid")
      .dataSource.data();

    err = true;

    classi.forEach(function(ele, i, arr) {
      if (ele.FLCHECK == true) {
        err = false;
        return;
      }
    });

    if (err) {
      displayError(grids);
      return false;
    }
  }

  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();
  var grids = [];
  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (
      v.MagicTemplateDataRole == "detailgrid" &&
      v.Schema &&
      v.Schema.Schema_required
    ) {
      var $grid = $stepkey.find(
        "div[gridname=" + v.searchGrid.SearchGridName + "]"
      );
      var numberOfrows = $grid.data("kendoGrid")
        ? $grid
            .data("kendoGrid")
            .dataSource.data()
            .toJSON().length
        : 0;
      if (!numberOfrows) grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    return false;
  }

  return true;
}

function setCheckAlbo(stepKey, scope, gridData, element, initializer) {
  console.log(initializer);
  var deferred = $.Deferred();

  var modeldata = gridData;
  var data = {
    initializer: initializer,
    wizardCode: scope.wizardCode,
    stepKey: stepKey,
    ID: scope.models.ID,
    data: modeldata,
  };
  //ask the database error log
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api.getDataSet(data, "custom.SR_USP_SetCertCheck").then(function(res) {
      if (res.status == 500 && res.error) {
        kendoConsole.log(res.status, true);
        deferred.reject();
      }

      deferred.resolve(stepKey);
    });
  });
  return deferred.promise();
}

function getWizardError(stepKey, scope, gridData, element, initializer) {
  console.log(initializer);
  var deferred = $.Deferred();
  var errorLog;
  var modeldata = !Object.keys(gridData).length
    ? scope.models[stepKey]
    : gridData;
  var data = {
    initializer: initializer,
    wizardCode: scope.wizardCode,
    stepKey: stepKey,
    ID: scope.models.ID,
    data: modeldata,
  };
  //ask the database error log
  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.api.getDataSet(data, "custom.SR_USP_VerifyErrors").then(function(res) {
      if (res.status == 500 && res.error) {
        kendoConsole.log(res.error, true);
        deferred.reject();
      } else {
        errorLog = res[0][0].error;
        deferred.resolve(errorLog, stepKey);
      }
    });
  });
  return deferred.promise();
}

function checkGridHasAtLeastInvestire(form, i, scope, element, initializer) {
  var stepKey = scope.settings.steps[i].stepKey;
  var check = $.Deferred();
  var $stepkey = $("div[data-step-key=" + stepKey + "]");
  var data;

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };

  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();

  if (initializer == "detailgrid") return true;

  var grids = [];
  var gridData = {};
  var skipDbCall;

  //mandatory doc & depended field
  if (stepKey == "SR_SUPREG_01") {
    data = scope.models.SR_SUPREG_01;
    //refresh docume
    if ($("div[gridname='SR_DOCUME_UPLOADED']").length)
      $('[data-step-key="SR_SUPREG_10"] [gridname="SR_DOCUME_UPLOADED"]')
        .scope()
        .$emit("reRenderGrid");
  }

  if (data && data != undefined && data != null)
    requireConfigAndMore(["MagicSDK"], function(MF) {
      MF.api
        .get({
          storedProcedureName: "custom.SR_USP_Get_Mandatory",
          data,
        })
        .then(
          function(result) {
            // deferred.resolve(result);
            console.log(result);

            //  if (result) scope.PF = result[0][0].PF;
          },
          function(err) {
            console.log(err);
          }
        );
    });

  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (v.MagicTemplateDataRole == "detailgrid" && v.Schema) {
      // var $grid = $stepkey
      //   .find('div[ng-init*=' + v.ColumnName + ']')
      //   .find('.k-grid');

      var $grid = $stepkey.find(
        "div[gridname=" + v.searchGrid.SearchGridName + "]"
      );

      gridData[v.ColumnName] = $grid
        .data("kendoGrid")
        .dataSource.data()
        .toJSON();

      var numberOfrows = $grid
        .data("kendoGrid")
        .dataSource.data()
        .toJSON().length;

      if (
        (v.ColumnName == "SR_CERT_REFERE_GRID" ||
          v.ColumnName == "SR_CERREF_SOA" ||
          v.ColumnName == "SR_CERREF_AMB") &&
        (initializer === undefined || initializer === null)
      ) {
        var data = $grid
          .data("kendoGrid")
          .dataSource.data()
          .toJSON();

        console.log("passo SR_CERT_REFERE_GRID");
        var error = "";
        //creo una nuova modal e la piazzo nella popup del wizard
        //alla chiusura del wizard verrà quindi distrutta anche la modale
        if ($("#alboModalContainer")) $("div").remove("#alboModalContainer");

        var htmlModal =
          '<div id="alboModalContainer" class="modal fade" tabindex="-1" role="dialog">\
                         <div class="modal-dialog" role="document">\
                         <div class="modal-content">\
                        <div class="modal-header">\
                          <h5 class="modal-title">Modal title</h5>\
                          <button type="button" class="closeMod1" data-dismiss="modal" aria-label="Close">\
                            <span aria-hidden="true">&times;</span>\
                          </button>\
                        </div  class="btn-group btn-group-toggle">\
                        <div id="modalAlbo" class="modal-body">\
                          <p>Modal body text goes here.</p>\
                        </div>\
                        <div class="modal-footer">\
                          <div class="btn-group">\
                          <button id="pros" type="button" class="btn btn-primary">Prosegui</button>\
                          <button type="button" class="btn btn-secondary" data-dismiss="modal">Annulla</button>\
                          </div>\
                        </div>\
                      </div>\
                    </div>\
                  </div>';

        $(htmlModal).appendTo($(".k-window-maximized"));

        var $modal = $("#alboModalContainer"),
          $content;
        var $content = $modal.find("#modalAlbo").empty();

        //event click prosegui

        $("#pros").on("click", function() {
          console.log($(this).text());
          var callDb = false;
          for (var i = 0; i < data.length; i++) {
            row = data[i];

            if (
              !row.FLAG_EXIST &&
              !row.SR_CERREF_NO_CERTIFICATION &&
              !row.SR_CERREF_COMMITMENT
            ) {
              callDb = true;

              console.log(row);
              break;
            }
          }
          if (callDb) {
            var setCheck = setCheckAlbo(
              stepKey,
              scope,
              gridData,
              this,
              stepKey
            );

            setCheck.then(function(res, stepKey) {
              // var gridName =
              //   res == 'SR_SUPREG_08'
              //     ? 'SR_VI_CERREF_LIST_INLINE'
              //     : 'SR_CERREF_SOA';
              $(".closeMod1").trigger("click");

              if (res == "SR_SUPREG_08")
                $(
                  '[data-step-key="SR_SUPREG_08"] [gridname="SR_VI_CERREF_LIST_INLINE"]'
                )
                  .scope()
                  .$emit("reRenderGrid");
              else if (res == "SR_SUPREG_09")
                $('[data-step-key="SR_SUPREG_09"] [gridname="SR_CERREF_SOA"]')
                  .scope()
                  .$emit("reRenderGrid");
              else if (res == "SR_SUPREG_09_1")
                $('[data-step-key="SR_SUPREG_09_1"] [gridname="SR_CERREF_AMB"]')
                  .scope()
                  .$emit("reRenderGrid");

              console.log(res);

              //da cambiare!!
              // devo fare la promise del refresh ...

              setTimeout(function() {
                debugger;
                $("button[title='Succ']")[scope.activeStep].click();
              }, 1500);
            });
          }
        });

        for (var i = 0; i < data.length; i++) {
          row = data[i];

          if (
            !row.FLAG_EXIST &&
            !row.SR_CERREF_NO_CERTIFICATION &&
            !row.SR_CERREF_COMMITMENT
          ) {
            console.log(row);
            skipDbCall = true;
            error += "<li>" + row.SR_CERREF_SR_CERTYP_ID_text + "</li>";
            check.resolve(false);
          }
        }
        if (error.length) {
          error =
            "<p>Attenzione! Proseguendo si dichiara di non essere in possesso delle seguenti certificazioni:" +
            "<br>" +
            error +
            "</p>";
          $content.html(error);
          $modal
            .find(".modal-title")
            .html(
              '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>'
            );

          //    $modal.appendTo('.k-window-maximized');

          $modal.modal("show");

          return $content;
        }
      }

      // function checkAteco(atecoData) {
      //   var isChecked = function(ateco) {
      //     return ateco.FLCHECK;
      //   };

      //   var filtered = atecoData.filter(isChecked);
      //   numberOfrows = filtered.length;
      //   skipDbCall = true;
      //   if (!filtered.length) {
      //     grids.push(v.labels[window.culture.slice(0, 2)]);
      //   }
      // }

      // v.ColumnName == 'SR_ATECO_GRID'
      //   ? checkAteco(gridData.SR_ATECO_GRID)
      //   : $grid.data('kendoGrid')
      //     ? (numberOfrows = $grid
      //         .data('kendoGrid')
      //         .dataSource.data()
      //         .toJSON().length)
      //     : (numberOfrows = 0);

      if (!numberOfrows && v.Schema.Schema_required)
        grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    //return false;
    check.resolve(false);
    return;
  }

  if (skipDbCall) check.resolve(true);
  else {
    var er = getWizardError(stepKey, scope, gridData, element, initializer);

    er.then(
      function(res, stepKey) {
        var data;
        console.log(res);
        if (res.length) {
          kendoConsole.log(res, "error");
          // return false;
          {
            check.resolve(false);
            return;
          }
        }

        check.resolve(true);
        return;
        // return true;
      },
      function(error) {
        console.log("Si è verificato un errore");
      }
    );
  }

  return check.promise(); //qui
}

function checkGridHasAtLeastAntirion(form, i, scope, element, initializer) {
  var stepKey = scope.settings.steps[i].stepKey;
  var check = $.Deferred();
  var $stepkey = $("div[data-step-key=" + stepKey + "]");
  var data;

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };

  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();

  if (initializer == "detailgrid") return true;

  var grids = [];
  var gridData = {};
  var skipDbCall;

  //mandatory doc & depended field
  if (stepKey == "SR_SUPREG_01") {
    data = scope.models.SR_SUPREG_01;
    //refresh docume
    if ($("div[gridname='SR_DOCUME_UPLOADED']").length)
      $('[data-step-key="SR_SUPREG_10"] [gridname="SR_DOCUME_UPLOADED"]')
        .scope()
        .$emit("reRenderGrid");
  }

  if (data && data != undefined && data != null)
    requireConfigAndMore(["MagicSDK"], function(MF) {
      MF.api
        .get({
          storedProcedureName: "custom.SR_USP_Get_Mandatory",
          data,
        })
        .then(
          function(result) {
            // deferred.resolve(result);
            console.log(result);

            //  if (result) scope.PF = result[0][0].PF;
          },
          function(err) {
            console.log(err);
          }
        );
    });

  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (v.MagicTemplateDataRole == "detailgrid" && v.Schema) {
      var $grid = $stepkey
        .find("div[ng-init*=" + v.ColumnName + "]")
        .find(".k-grid");

      gridData[v.ColumnName] = $grid
        .data("kendoGrid")
        .dataSource.data()
        .toJSON();

      var numberOfrows = 0;

      function checkAteco(atecoData) {
        var isChecked = function(ateco) {
          return ateco.FLCHECK;
        };

        var filtered = atecoData.filter(isChecked);
        numberOfrows = filtered.length;
        skipDbCall = true;
        if (!filtered.length) {
          grids.push(v.labels[window.culture.slice(0, 2)]);
        }
      }

      if (
        (v.ColumnName == "SR_CERT_REFERE_GRID" ||
          v.ColumnName == "SR_CERREF_SOA" ||
          v.ColumnName == "SR_CERREF_AMB") &&
        (initializer === undefined || initializer === null)
      ) {
        var data = $grid
          .data("kendoGrid")
          .dataSource.data()
          .toJSON();

        console.log("passo SR_CERT_REFERE_GRID");
        var error = "";
        //creo una nuova modal e la piazzo nella popup del wizard
        //alla chiusura del wizard verrà quindi distrutta anche la modale
        if ($("#alboModalContainer")) $("div").remove("#alboModalContainer");

        var htmlModal =
          '<div id="alboModalContainer" class="modal fade" tabindex="-1" role="dialog">\
                         <div class="modal-dialog" role="document">\
                         <div class="modal-content">\
                        <div class="modal-header">\
                          <h5 class="modal-title">Modal title</h5>\
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                            <span aria-hidden="true">&times;</span>\
                          </button>\
                        </div  class="btn-group btn-group-toggle">\
                        <div id="modalAlbo" class="modal-body">\
                          <p>Modal body text goes here.</p>\
                        </div>\
                        <div class="modal-footer">\
                          <div class="btn-group">\
                          <button id="pros" type="button" class="btn btn-primary">Prosegui</button>\
                          <button type="button" class="btn btn-secondary" data-dismiss="modal">Annulla</button>\
                          </div>\
                        </div>\
                      </div>\
                    </div>\
                  </div>';

        $(htmlModal).appendTo($(".k-window-maximized"));

        var $modal = $("#alboModalContainer"),
          $content;
        var $content = $modal.find("#modalAlbo").empty();

        //event click prosegui

        $("#pros").on("click", function() {
          console.log($(this).text());
          var callDb = false;
          for (var i = 0; i < data.length; i++) {
            row = data[i];

            if (
              !row.FLAG_EXIST &&
              !row.SR_CERREF_NO_CERTIFICATION &&
              !row.SR_CERREF_COMMITMENT
            ) {
              callDb = true;

              console.log(row);
              break;
            }
          }
          if (callDb) {
            var setCheck = setCheckAlbo(
              stepKey,
              scope,
              gridData,
              this,
              stepKey
            );

            setCheck.then(function(res, stepKey) {
              // var gridName =
              //   res == 'SR_SUPREG_08'
              //     ? 'SR_VI_CERREF_LIST_INLINE'
              //     : 'SR_CERREF_SOA';
              $(".close").trigger("click");

              if (res == "SR_SUPREG_08")
                $(
                  '[data-step-key="SR_SUPREG_08"] [gridname="SR_VI_CERREF_LIST_INLINE"]'
                )
                  .scope()
                  .$emit("reRenderGrid");
              else if (res == "SR_SUPREG_09")
                $('[data-step-key="SR_SUPREG_09"] [gridname="SR_CERREF_SOA"]')
                  .scope()
                  .$emit("reRenderGrid");
              else if (res == "SR_SUPREG_09_1")
                $('[data-step-key="SR_SUPREG_09_1"] [gridname="SR_CERREF_AMB"]')
                  .scope()
                  .$emit("reRenderGrid");

              console.log(res);

              //da cambiare!!
              // devo fare la promise del refresh ...

              setTimeout(function() {
                debugger;
                $("button[title='Succ']")[scope.activeStep].click();
              }, 1500);
            });
          }
        });

        for (var i = 0; i < data.length; i++) {
          row = data[i];

          if (
            !row.FLAG_EXIST &&
            !row.SR_CERREF_NO_CERTIFICATION &&
            !row.SR_CERREF_COMMITMENT
          ) {
            console.log(row);
            skipDbCall = true;
            error += "<li>" + row.SR_CERREF_SR_CERTYP_ID_text + "</li>";
            check.resolve(false);
          }
        }
        if (error.length) {
          error =
            "<p>Attenzione! Proseguendo si dichiara di non essere in possesso delle seguenti certificazioni:" +
            "<br>" +
            error +
            "</p>";
          $content.html(error);
          $modal
            .find(".modal-title")
            .html(
              '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>'
            );

          //    $modal.appendTo('.k-window-maximized');

          $modal.modal("show");

          return $content;
        }
      }

      v.ColumnName == "SR_ATECO_GRID"
        ? checkAteco(gridData.SR_ATECO_GRID)
        : $grid.data("kendoGrid")
          ? (numberOfrows = $grid
              .data("kendoGrid")
              .dataSource.data()
              .toJSON().length)
          : (numberOfrows = 0);

      if (!numberOfrows && v.Schema.Schema_required)
        grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    //return false;
    check.resolve(false);
    return;
  }

  if (skipDbCall) check.resolve(true);
  else {
    var er = getWizardError(stepKey, scope, gridData, element, initializer);

    er.then(
      function(res, stepKey) {
        var data;
        console.log(res);
        if (res.length) {
          kendoConsole.log(res, "error");
          // return false;
          {
            check.resolve(false);
            return;
          }
        }

        check.resolve(true);
        return;
        // return true;
      },
      function(error) {
        console.log("Si è verificato un errore");
      }
    );
  }

  return check.promise(); //qui
}

function checkWizardError(form, i, scope, element, initializer) {
  var stepKey = scope.settings.steps[i].stepKey;
  var $stepkey = $("div[data-step-key=" + stepKey + "]");
  var gridData = {};
  var check = $.Deferred();
  console.log(stepKey);

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };
  if (!scope.models[stepKey]) displayError();
  var grids = [];
  var er;
  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (v.MagicTemplateDataRole == "detailgrid" && v.Schema) {
      var $grid = $stepkey
        .find("div[ng-init*=" + v.ColumnName + "]")
        .find(".k-grid");
      var numberOfrows = $grid.data("kendoGrid")
        ? $grid
            .data("kendoGrid")
            .dataSource.data()
            .toJSON().length
        : 0;
      if (!numberOfrows && v.Schema.Schema_required)
        grids.push(v.labels[window.culture.slice(0, 2)]);

      gridData = $grid.data("kendoGrid").dataSource.data();

      //get wizard error from custom SP (custom.SR_USP_VerifyError)
      er = getWizardError(stepKey, scope, gridData, element, initializer);

      if (grids.length) {
        displayError(grids);
        check.resolve(false);
        return;
      }
    } else {
      er = getWizardError(stepKey, scope, gridData, element, initializer);
      return false;
    }
  });

  er.then(
    function(res, stepKey) {
      var data;
      console.log(res);
      if (res.length) {
        kendoConsole.log(res, "error");
        // return false;
        {
          check.resolve(false);
          return;
        }
      }

      check.resolve(true);
      return;
      // return true;
    },
    function(error) {
      console.log("Si è verificato un errore");
    }
  );
  return check.promise();
}

function checkGridHasAtLeastEur(form, i, scope, element, initializer) {
  var stepKey = scope.settings.steps[i].stepKey;
  var check = $.Deferred();
  var $stepkey = $("div[data-step-key=" + stepKey + "]");

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };

  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();
  var grids = [];
  var gridData = {};
  var skipDbCall;
  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (v.MagicTemplateDataRole == "detailgrid" && v.Schema) {
      var $grid = $stepkey
        .find("div[ng-init*=" + v.ColumnName + "]")
        .find(".k-grid");

      gridData[v.ColumnName] = $grid
        .data("kendoGrid")
        .dataSource.data()
        .toJSON();

      var numberOfrows = 0;

      function checkAteco(atecoData) {
        var isChecked = function(ateco) {
          return ateco.FLCHECK;
        };

        var filtered = atecoData.filter(isChecked);
        numberOfrows = filtered.length;
        skipDbCall = true;
        if (!filtered.length) {
          grids.push(v.labels[window.culture.slice(0, 2)]);
        }
      }

      v.ColumnName == "SR_ATECO_GRID"
        ? checkAteco(gridData.SR_ATECO_GRID)
        : $grid.data("kendoGrid")
          ? (numberOfrows = $grid
              .data("kendoGrid")
              .dataSource.data()
              .toJSON().length)
          : (numberOfrows = 0);

      if (!numberOfrows && v.Schema.Schema_required)
        grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    //return false;
    check.resolve(false);
    return;
  }

  if (skipDbCall) check.resolve(true);
  else {
    var er = getWizardError(stepKey, scope, gridData, element, initializer);

    er.then(
      function(res, stepKey) {
        var data;
        console.log(res);
        if (res.length) {
          kendoConsole.log(res, "error");
          // return false;
          {
            check.resolve(false);
            return;
          }
        }

        check.resolve(true);
        return;
        // return true;
      },
      function(error) {
        console.log("Si è verificato un errore");
      }
    );
  }

  return check.promise(); //qui
}

function checkValidateEur(form, i, scope) {
  var stepKey = scope.settings.steps[i].stepKey;
  var $stepkey = $("div[data-step-key=" + stepKey + "]");
  var data;
  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };
  //mandatory doc & depended field
  if (stepKey == "SR_SUPREG_01") {
    data = scope.models.SR_SUPREG_01;
  }

  if (stepKey == "SR_SUPREG_03") {
    if (scope.models.SR_SUPREG_03.SR_CORP_COMP_GRID)
      data = {
        SR_CORP_COMP_GRID: scope.models.SR_SUPREG_03.SR_CORP_COMP_GRID,
        LE_REFERE_ID: scope.models.SR_SUPREG_01.LE_REFERE_ID,
        SR_SUPREG_ID: scope.models.ID,
        LE_REFERE_LE_TIPREF_ID:
          scope.models.SR_SUPREG_01.LE_REFERE_LE_TIPREF_ID,
      };
  }

  if (data && data != undefined && data != null)
    requireConfigAndMore(["MagicSDK"], function(MF) {
      MF.api
        .get({
          storedProcedureName: "custom.SR_USP_Get_Mandatory",
          data,
        })
        .then(
          function(result) {
            // deferred.resolve(result);
            console.log(result);

            if (result) scope.PF = result[0][0].PF;
          },
          function(err) {
            console.log(err);
          }
        );
    });

  if (stepKey == "SR_SUPREG3_N") {
    if (
      scope.PF === undefined &&
      scope.models.SR_SUPREG_01.SR_LE_TIREF_CODE &&
      scope.models.SR_SUPREG_01.SR_LE_TIREF_CODE === "PERFIS"
    )
      return true;

    if (scope.PF) {
      return true;
    }

    var datRevenue = $("div[gridname='SR_VI_CAPECO_LIST']")
      .data("kendoGrid")
      .dataSource.data();

    var err = "";

    datRevenue.forEach(function(ele, i, arr) {
      console.log(ele);
      if (ele.SR_CAPETE_REVENUE == null || ele.SR_CAPETE_REVENUE === 0) {
        if (arr.length > 1)
          err =
            "Attenzione! Completare i dati relativi alla capacità economica indicando il fatturato per ciascuno degli anni indicati";
        else
          err =
            "Attenzione! Completare il dato relativo alla capacità economica indicando il fatturato per l'anno " +
            ele.Anno;
        return;
      }
    });

    if (err.length) {
      kendoConsole.log(err, "error");
      return false;
    }
  }

  if (stepKey == "SR_SUPREG_1BIS") {
    var err;

    var classi = $("div[gridname='SR_VI_CategMerc']")
      .data("kendoGrid")
      .dataSource.data();

    err = true;

    classi.forEach(function(ele, i, arr) {
      if (ele.FLCHECK == true) {
        err = false;
        return true;
      }
    });

    if (err) {
      displayError(grids);
      return false;
    }
  }

  if (stepKey == "SR_SUPREG_08") {
    data = scope.models;
    var ruoli = $("div[gridname='SR_VW_CORPORATE_OPER']")
      .data("kendoGrid")
      .dataSource.data();
    var sedi = $("div[gridname='SR_OFFLST_office_list']")
      .data("kendoGrid")
      .dataSource.data();

    data.SR_SUPREG_03.SR_VW_CORPORATE_OPER = ruoli;
    data.SR_SUPREG_02.SR_OFFLST_OFFICE_LIST = sedi;

    if (data && data != undefined && data != null)
      requireConfigAndMore(["MagicSDK"], function(MF) {
        MF.api
          .get({
            storedProcedureName: "custom.SR_USP_Get_PrintData",
            data,
          })
          .then(
            function(result) {
              // deferred.resolve(result);
              console.log(result);
            },
            function(err) {
              console.log(err);
            }
          );
      });

    if (data && data != undefined && data != null)
      requireConfigAndMore(["MagicSDK"], function(MF) {
        MF.api
          .get({
            storedProcedureName: "custom.SR_USP_Get_Mandatory",
            data,
          })
          .then(
            function(result) {
              // deferred.resolve(result);
              console.log(result);

              if (result) scope.PF = result[0][0].PF;
            },
            function(err) {
              console.log(err);
            }
          );
      });
  }

  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();
  var grids = [];
  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (
      v.MagicTemplateDataRole == "detailgrid" &&
      v.Schema &&
      v.Schema.Schema_required
    ) {
      var $grid = $stepkey
        .find("div[ng-init*=" + v.ColumnName + "]")
        .find(".k-grid");
      var numberOfrows = $grid.data("kendoGrid")
        ? $grid
            .data("kendoGrid")
            .dataSource.data()
            .toJSON().length
        : 0;
      if (!numberOfrows) grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    return false;
  }

  return true;
}

function checkGridHasAtLeastAndDoc(form, i, scope) {
  var stepKey = scope.settings.steps[i].stepKey;

  var $stepkey = $("div[data-step-key=" + stepKey + "]");

  //mandatory doc
  if (stepKey == "SR_SUPREG_08") {
    var data = {
      LE_REFERE_ID: scope.models.SR_SUPREG_08.LE_REFERE_ID,
      SR_SUPREG_ID: scope.models.ID,
      SR_QUAREF_qualification_refere: $(
        "div[gridname='SR_QUAREF_qualification_refere']"
      )
        .data("kendoGrid")
        .dataSource.data(),
      SR_CORPORATE_COMPOSITION: $("div[gridname='SR_CORPORATE_COMPOSITION']")
        .data("kendoGrid")
        .dataSource.data(),
      SR_CERREF_CERT_REFERE: $("div[gridname='SR_CERREF_CERT_REFERE']").length
        ? $("div[gridname='SR_CERREF_CERT_REFERE']")
            .data("kendoGrid")
            .dataSource.data()
        : null,
    };

    requireConfigAndMore(["MagicSDK"], function(MF) {
      MF.api
        .get({
          storedProcedureName: "custom.USP_Get_MandDoc",
          data,
        })
        .then(
          function(result) {
            // deferred.resolve(result);
            console.log(result);
          },
          function(err) {
            console.log(err);
          }
        );
    });
  }

  var displayError = function(grids) {
    kendoConsole.log(
      "Inserire almeno un valore!" +
        (grids && grids.length ? " (" + grids.join(",") + ")" : ""),
      "error"
    );
  };
  //check for mandatory detailgrid in current steps
  if (!scope.models[stepKey]) displayError();
  var grids = [];
  //search for grids with errors
  $.each(scope.settings.steps[i].fields, function(i, v) {
    if (
      v.MagicTemplateDataRole == "detailgrid" &&
      v.Schema &&
      v.Schema.Schema_required
    ) {
      var $grid = $stepkey.find(
        "div[gridname=" + v.searchGrid.SearchGridName + "]"
      );

      var numberOfrows = $grid.data("kendoGrid")
        ? $grid
            .data("kendoGrid")
            .dataSource.data()
            .toJSON().length
        : 0;
      if (!numberOfrows) grids.push(v.labels[window.culture.slice(0, 2)]);
    }
  });

  if (grids.length) {
    displayError(grids);
    return false;
  }

  return true;
}

function setGridHtmlCad(grid) {
  grid.edit = function(e) {
    if (e.model.isNew()) {
      e.container.data("kendoWindow").one("close", function() {
        console.log("chiuso");
      });
    }
  };

  //grid.dataSource.transport.options.create.complete = self.onSaveChanges;
  ////origGrid.dataSource.bind("requestEnd", function (e) {

  ////                                        });
  //grid.bind("edit", function (e) {
  //    if (e.model.isNew()) {
  //        if (!onEditEvent) {
  //            onEditEvent = true;
  //            e.container.data("kendoWindow").one("close", self.onCloseGridNewBlocks);
  //            e.model.PL_ASSET_GUID_CAD = newHandle;
  //        }
  //    }
  //});
}

function qrCodeR3(e, options) {
  grid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");

  if ((grid.select().length = 0)) {
    return;
  }

  var key = !e.id ? e.className : e.id;
  var jsonpayload = {};
  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
  } catch (e) {
    kendoConsole.log("JsonPayload is not valid", true);
    return;
  }

  var divQrCodeR3 =
    '<div id="divQrCodeR3" style="position: relative; z-index: -1;"></div>';

  $("#appcontainer").append(divQrCodeR3);

  $("#divQrCodeR3").empty();
  $.each(grid.select(), function(i, v) {
    pdfExport = "";
    pdfExport +=
      '<div id="qrcodeframe' +
      i +
      '" ' +
      (!!jsonpayload.styleDivFrame ? jsonpayload.styleDivFrame : "") +
      ">"; //
    pdfExport +=
      '<div id="qrcodeexport' + i + '" style="display: table;"></div>';
    if (jsonpayload.showLabel) {
      pdfExport +=
        '<div id="qrCodeTitle" ' +
        (!!jsonpayload.styleDivTitle
          ? jsonpayload.styleDivTitle
          : "style='margin-top: -5px;'") +
        " ><p " +
        (!!jsonpayload.styleTitle ? jsonpayload.styleTitle : "") +
        " >" +
        grid.dataItem(grid.select()[i])[jsonpayload.barcodeDesciption] +
        "</p></div>";
    }
    pdfExport += "</div>";

    $("#divQrCodeR3").append(pdfExport);

    $("#qrcodeexport" + i).kendoQRCode({
      value: grid.dataItem(grid.select()[i])[jsonpayload.barCodeValue],
      size: jsonpayload.size,
    });
  });

  kendo.drawing
    .drawDOM($("#divQrCodeR3"), {
      forcePageBreak: ".new-page",
      paperSize: !!jsonpayload.paperSize ? jsonpayload.paperSize : "A4",
      landscape: jsonpayload.landscape ? jsonpayload.landscape : false,
      margin: {
        left: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "",
        top: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "", //(!!jsonpayload.marginPage.top ? jsonpayload.marginPage.top : ""),
        right: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "", //(!!jsonpayload.marginPage.right ? jsonpayload.marginPage.right : ""),
        bottom: !!jsonpayload.marginPage
          ? !!jsonpayload.marginPage.left
            ? jsonpayload.marginPage.left
            : ""
          : "", //(!!jsonpayload.marginPage.bottom ? jsonpayload.marginPage.bottom : "")
      },
    })
    .then(function(group) {
      return kendo.drawing.exportPDF(group);
    })
    .done(function(data) {
      var fileName = new Date().getTime() + "-" + jsonpayload.nomeFile;

      /*var config = {
                    method: 'POST',
                    url: '/api/MAGIC_SAVEFILE/SaveApplication',
                    data: data,
                    processData: false,
                    contentType: 'application/binary',
                    headers: {
                        'File-Name': fileName,
                    }
                };
                return $.ajax(config)
                 .then(function (result) {
                        var serverFileInfo = JSON.parse(result);
                        serverFileInfo[0].savePath = '' || '';
                        serverFileInfo[0].adminAreaUpload = false || false;
                        var config = {
                            method: 'POST',
                            url: '/api/MAGIC_SAVEFILE/ManageUploadedFiles',
                            data: JSON.stringify({
                                filesToDelete: [],
                                filesToSave: [
                                    serverFileInfo[0],
                                ]
                            }),
                            contentType: 'application/json',
                        };
                        return $.ajax(config)
                            .then(function () {
                            	
                            	
                            	
                            	
                            	
                                return { name: fileName };
                            });
                    })*/

      kendo.saveAs({
        dataURI: data,
        fileName: new Date().getTime() + "-" + jsonpayload.nomeFile,
        proxyURL: "",
      });
    });
}

function qrCodeSaveFiles(e, options) {
  grid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");

  if ((grid.select().length = 0)) {
    return;
  }

  var key = !e.id ? e.className : e.id;
  var jsonpayload = {};
  try {
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
  } catch (e) {
    kendoConsole.log("JsonPayload is not valid", true);
    return;
  }

  var optionsQrCOde = {
    forcePageBreak: ".new-page",
    paperSize: !!jsonpayload.paperSize ? jsonpayload.paperSize : "A4",
    landscape: jsonpayload.landscape ? jsonpayload.landscape : false,
    margin: {
      left: !!jsonpayload.marginPage
        ? !!jsonpayload.marginPage.left
          ? jsonpayload.marginPage.left
          : ""
        : "",
      top: !!jsonpayload.marginPage
        ? !!jsonpayload.marginPage.left
          ? jsonpayload.marginPage.left
          : ""
        : "", //(!!jsonpayload.marginPage.top ? jsonpayload.marginPage.top : ""),
      right: !!jsonpayload.marginPage
        ? !!jsonpayload.marginPage.left
          ? jsonpayload.marginPage.left
          : ""
        : "", //(!!jsonpayload.marginPage.right ? jsonpayload.marginPage.right : ""),
      bottom: !!jsonpayload.marginPage
        ? !!jsonpayload.marginPage.left
          ? jsonpayload.marginPage.left
          : ""
        : "", //(!!jsonpayload.marginPage.bottom ? jsonpayload.marginPage.bottom : "")
    },
  };

  var filesToAdd = [];
  var filesToDelete = [];

  $.each(grid.select(), function(i, v) {
    if (
      jsonpayload.fileName != undefined &&
      grid.dataItem(grid.select()[i])[jsonpayload.fileName] != "" &&
      grid.dataItem(grid.select()[i])[jsonpayload.fileName] != null
    ) {
      var tableFileInfo = JSON.parse(
        grid.dataItem(grid.select()[i])[jsonpayload.fileName]
      );

      filesToDelete.push({
        adminAreaUpload: false,
        name: tableFileInfo[0].name,
        savePath: grid.dataItem(grid.select()[i])[jsonpayload.pathFile]
          ? grid.dataItem(grid.select()[i])[jsonpayload.pathFile]
          : "",
      });
    }

    var divQrCodeR3 =
      '<div id="divQrCodeR' +
      i +
      '"  style="position: relative; z-index: -1;"></div>';
    $("#appcontainer").append(divQrCodeR3);
    $("#divQrCodeR" + i).empty();

    pdfExport = "";
    pdfExport +=
      '<div id="qrcodeframe' +
      i +
      '" ' +
      (!!jsonpayload.styleDivFrame ? jsonpayload.styleDivFrame : "") +
      ">"; //
    pdfExport +=
      '<div id="qrcodeexport' + i + '" style="display: table;"></div>';

    if (jsonpayload.showLabel) {
      pdfExport +=
        '<div id="qrCodeTitle" ' +
        (!!jsonpayload.styleDivTitle
          ? jsonpayload.styleDivTitle
          : "style='margin-top: -5px;'") +
        " ><p " +
        (!!jsonpayload.styleTitle ? jsonpayload.styleTitle : "") +
        " >" +
        grid.dataItem(grid.select()[i])[jsonpayload.barcodeDesciption] +
        "</p></div>";
    }
    pdfExport += "</div>";

    $("#divQrCodeR" + i).append(pdfExport);

    $("#qrcodeexport" + i).kendoQRCode({
      value: grid.dataItem(grid.select()[i])[jsonpayload.barCodeValue],
      size: jsonpayload.size,
    });

    kendo.drawing
      .drawDOM($("#divQrCodeR" + i), optionsQrCOde)
      .then(function(group) {
        if (jsonpayload.extention == ".pdf") {
          return kendo.drawing.exportPDF(group);
        } else {
          return kendo.drawing.exportImage(group, {
            width: jsonpayload.size + "px",
            height: jsonpayload.size + 15 + "px",
          });
        }
      })
      .done(function(data) {
        var BASE64_MARKER = ";base64,";
        var fileName =
          new Date().getTime() +
          "-" +
          grid.dataItem(grid.select()[i])["id"] +
          "-" +
          jsonpayload.nomeFile +
          jsonpayload.extention;

        function convertDataURIToBinary(dataURI) {
          var base64Index =
            dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
          var base64 = dataURI.substring(base64Index);
          var raw = window.atob(base64);
          var rawLength = raw.length;
          var array = new Uint8Array(new ArrayBuffer(rawLength));

          for (var i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
          }
          return array;
        }

        $("#divQrCodeR" + i).remove();

        var config = {
          method: "POST",
          url: "/api/MAGIC_SAVEFILE/SaveApplication",
          data: convertDataURIToBinary(data),
          processData: false,
          contentType: "application/json",
          headers: {
            "File-Name": fileName,
            responseType: "application/pdf",
          },
        };
        $.ajax(config).then(function(result) {
          var serverFileInfo = JSON.parse(result);
          serverFileInfo[0].savePath = grid.dataItem(grid.select()[i])[
            jsonpayload.savePath
          ]
            ? grid.dataItem(grid.select()[i])[jsonpayload.savePath]
            : "";
          serverFileInfo[0].adminAreaUpload = false || false;

          filesToAdd.push({
            adminAreaUpload: serverFileInfo[0].adminAreaUpload,
            name: serverFileInfo[0].name,
            savePath: serverFileInfo[0].savePath,
            id: grid.dataItem(grid.select()[i])["id"],
            tmpFile: serverFileInfo[0].tmpFile,
          });

          if (filesToAdd.length == grid.select().length) {
            saveQrcodeFiles();
          }
        });
      });
  });

  function saveQrcodeFiles() {
    var config = {
      method: "POST",
      url: "/api/MAGIC_SAVEFILE/ManageUploadedFiles",
      data: JSON.stringify({
        filesToDelete: filesToDelete,
        filesToSave: filesToAdd,
      }),
      contentType: "application/json",
    };
    $.ajax(config)
      .then(function() {
        requireConfigAndMore(["MagicSDK"], function(MF) {
          MF.api
            .get({
              storedProcedureName: jsonpayload.storedProcedureName,
              models: filesToAdd,
            })
            .then(
              function(result) {
                grid.dataSource.read();
                grid.refresh();
                kendoConsole.log("Elaborazione effettuata.", false);
              },
              function(err) {
                kendoConsole.log("Elaborazione non effettuata." + err, true);
              }
            );
        });
      })
      .fail(function(err) {
        console.log(err);
      });
  }
}

function RemoveCommandsFromToolbar(grid) {
  /**
   * La funzione viene chiamata se nel model della griglia
   * è presente un campo chiamato "RemoveCommands".
   * Come valore del campo si aspetta una lista separata da ";"
   * senza spazzi che elenca gli ID degli elementi da trovare nella tollbar e rimuovere.
   * Il valore del campo "RemoveCommands" verrà valutato esclusivamente sul primo record del dataSet.
   */

  //Aggiunta del comportamento in seguito al dataBound
  var originalDataBound = grid.dataBound;
  grid.dataBound = function(e) {
    if (originalDataBound) originalDataBound.call(this, e);
    //Recupero i dati delle colonne
    var toolbar = e.sender.options.toolbar; //Recupero i dati della toolbar
    var gridData = e.sender.dataSource.data(); // Grid data

    //Se nel modello della griglia esiste un campo "RemoveCommands" popoolato
    if (gridData[0] && gridData[0]["RemoveCommands"]) {
      var commToRemove = gridData[0]["RemoveCommands"].split(";"); //Recupero gli ID dei comandi da rimuovere dalla toolbar

      //Scorro gli elementi della toolbar e rimuovo i comandi indesiderati
      toolbar.forEach(function(e, i) {
        if (e.template && $(e.template)[0] && $(e.template)[0].id != "") {
          var commId = $(e.template)[0].id;
          //Se esiste un id nell'array commToRemove uquale all'ID di uno dei domElems allora questo va rimosso
          // commToRemove.find(function (item) {
          //     console.log('Removing toolbar Command:', item);
          //     $('#' + commId).remove();
          //     return item === commId;
          // });
          if (commToRemove.includes(commId)) {
            console.log("Removing toolbar Command:", commId);
            $("#" + commId).remove();
          }
        }
      });
    }
  };
}

function getInputItem(formItems, fieldName) {
  if (formItems != null) {
    for (var rowKey = 0; rowKey < formItems.length; rowKey++) {
      for (var colKey = 0; colKey < formItems[rowKey].items.length; colKey++) {
        if (formItems[rowKey].items[colKey].items[0].key[0] == fieldName) {
          return formItems[rowKey].items[colKey].items[0];
          break;
        }
      }
    }
  }
}

function getOptItem(option, fieldName) {
  var optSett = option.options.formDefinition;
  if (optSett != null) {
    for (var rowKey = 0; rowKey < optSett.length; rowKey++) {
      if (optSett[rowKey].ColumnName == fieldName) return optSett[rowKey];
    }
  }
}

function getWizardCascadeCol(option, fieldName) {
  var optSett = option.options.formDefinition;
  if (optSett != null) {
    for (var rowKey = 0; rowKey < optSett.length; rowKey++) {
      if (optSett[rowKey].CascadeColumnName == fieldName)
        return optSett[rowKey];
    }
  }
}

function getWizardFilterCol(option, fieldName) {
  var optSett = option.options.formDefinition;
  if (optSett != null) {
    for (var rowKey = 0; rowKey < optSett.length; rowKey++) {
      if (optSett[rowKey].CascadeFilterColumnName == fieldName)
        return optSett[rowKey];
    }
  }
}

function getWizardCascadeColNew(option, fieldName) {
  var optSett = option.options.formDefinition;

  if (optSett != null) {
    for (var rowKey = 0; rowKey < optSett.length; rowKey++) {
      if (
        optSett[rowKey].ColumnName == fieldName &&
        typeof optSett[rowKey].MagicFormExtension.custDataSource
          .cascadeFromCol != "undefined"
      ) {
        return optSett[rowKey];
      }

      // if (optSett[rowKey].CascadeFilterColumnName == fieldName)
      //     return optSett[rowKey];
    }
  }
}

function getWizardFilterColNew(option, fieldName) {
  console.log("dd");

  var optSett = option.options.formDefinition;

  if (optSett != null) {
    for (var rowKey = 0; rowKey < optSett.length; rowKey++) {
      if (
        typeof optSett[rowKey].MagicFormExtension.custDataSource !=
          "undefined" &&
        typeof optSett[rowKey].MagicFormExtension.custDataSource
          .cascadeFromCol != "undefined" &&
        optSett[rowKey].MagicFormExtension.custDataSource.cascadeFromCol ==
          fieldName
      ) {
        return optSett[rowKey];
      }

      // if (optSett[rowKey].CascadeFilterColumnName == fieldName)
      //     return optSett[rowKey];
    }
  }
}

function populateWizardOptions(
  value,
  formItems,
  scope,
  element,
  $timeout,
  columnName
) {
  var input = getInputItem(formItems, columnName),
    filters = null,
    requestKey =
      new Date().getTime() +
      "-" +
      Math.random()
        .toString(36)
        .substring(7),
    opt = getOptItem(scope, columnName);

  scope.requestKeys["" + columnName] = requestKey;
  scope.model["" + columnName] = scope.model["" + columnName] || [];
  if (!$.isArray(scope.model["" + columnName]))
    scope.model["" + columnName] = [scope.model["" + columnName]];

  var typObj = opt.MagicFormExtension.custDataSource.stored ? "1" : "2";
  var obj = opt.MagicFormExtension.custDataSource.stored
    ? opt.MagicFormExtension.custDataSource.stored
    : opt.MagicFormExtension.custDataSource.view;

  //per il momento ...da inserire il typObj in conf
  if (columnName == "TK_REFSER_TK_SERVIC_ID") {
    (typObj = "1"), (obj = "core.USP_GetDropServ");
  }

  //nb attualmente i filters non sono gestiti. Non è gestito quindi il cascade
  GetDropdownValues(
    obj,
    opt.MagicFormExtension.custDataSource.field,
    opt.MagicFormExtension.custDataSource.text,
    opt.MagicFormExtension.custDataSource.schema,
    opt.MagicFormExtension.custDataSource.typeofdatasource
      ? opt.MagicFormExtension.custDataSource.typeofdatasource
      : typObj,
    filters,
    true
  ).then(function(res) {
    if (input) {
      input.titleMap = [];
      var values = [];
      if (res && scope.requestKeys["" + columnName] == requestKey) {
        $.each(res, function(k, v) {
          var val = parseInt(v.value);
          input.titleMap.push({
            value: val,
            name: v.text,
          });
          values.push(val);
        });
      }
      var i = 0;
      while (i < scope.model["" + columnName].length) {
        if (values.indexOf(parseInt(scope.model["" + columnName][i])) == -1)
          scope.model["" + columnName].splice(i, 1);
        else i++;
      }
    }

    $timeout(function() {
      scope.$broadcast("schemaFormRedraw");
    }, 0);
  });
}
//in sviluppo!!
// da recuperare dalla configurazione i riferimenti agli oggetti di db

function populateWizardOptionsCascade1(
  value,
  formItems,
  scope,
  element,
  $timeout,
  columnName
) {
  var input = getInputItem(formItems, columnName),
    filters = null,
    requestKey =
      new Date().getTime() +
      "-" +
      Math.random()
        .toString(36)
        .substring(7),
    opt = getOptItem(scope, columnName),
    cascadeOpt = getWizardCascadeColNew(scope, columnName),
    colCascadeOpt = getWizardFilterColNew(scope, columnName);

  if (colCascadeOpt) {
    var inputCasc = getInputItem(formItems, colCascadeOpt.ColumnName),
      fileterCasc = null;

    if (inputCasc && value) {
      var fileterCasc = {
        field:
          colCascadeOpt.MagicFormExtension.custDataSource
            .CascadeFilterColumnName,
        operator: "eq",
        value: value.join(","),
      };

      inputCasc.titleMap = [];
      //da inserire il typedatasource in configurazione per renderlo generico
      GetDropdownValues(
        colCascadeOpt.MagicFormExtension.custDataSource.view,
        colCascadeOpt.MagicFormExtension.custDataSource.field,
        colCascadeOpt.MagicFormExtension.custDataSource.text,
        colCascadeOpt.MagicFormExtension.custDataSource.schema,
        colCascadeOpt.MagicFormExtension.custDataSource.typeofdatasource,
        fileterCasc,
        true
      ).then(function(res) {
        // if (inputCasc.titleMap)
        inputCasc.titleMap = [];
        var values = [];
        if (res.length == 0) scope.model["TK_REFSER_TK_SERVIC_ID"] = [];
        $.each(res, function(k, v) {
          var val = parseInt(v.value);
          inputCasc.titleMap.push({
            value: v.value,
            name: v.text,
          });
          values.push(val);
          /* var i = 0;
                     while (i < scope.model["" + colCascadeOpt.ColumnName].length) {
                       if (
                         values.indexOf(
                           parseInt(scope.model["" + colCascadeOpt.ColumnName][i])
                         ) == -1
                       )
                         //  scope.model[''+columnName].splice(i, 1);
                         scope.model["" + colCascadeOpt.ColumnName].splice(i, 1);
                       else i++;
                     }*/
        });

        $timeout(function() {
          scope.$broadcast("schemaFormRedraw");
        }, 10);
      });
    }
  }
  scope.requestKeys["" + columnName] = requestKey;
  scope.model["" + columnName] = scope.model["" + columnName] || [];
  if (!$.isArray(scope.model["" + columnName]))
    scope.model["" + columnName] = [scope.model["" + columnName]];

  // if (cascadeOpt) {
  //   filters =
  //     scope.model[
  //       '' + cascadeOpt.MagicFormExtension.custDataSource.cascadeFromCol
  //     ].length > 0
  //       ? {
  //           field: cascadeOpt.MagicFormExtension.custDataSource.cascadeFromCol,
  //           operator: 'eq',
  //           value: scope.model[
  //             '' + cascadeOpt.MagicFormExtension.custDataSource.cascadeFromCol
  //           ].join(','),
  //         }
  //       : null;
  //   typObj = '1';
  //   obj = 'core.USP_GetDropServ';
  //   //         //nb attualmente i filters non sono gestiti. Non è gestito quindi il cascade
  // }

  // var typObj = opt.MagicFormExtension.custDataSource.stored ? '1' : '2';
  // var obj = opt.MagicFormExtension.custDataSource.stored
  //   ? opt.MagicFormExtension.custDataSource.stored
  //   : opt.MagicFormExtension.custDataSource.view;

  // if (columnName == 'TK_REFSER_TK_SERVIC_ID') {
  //   (typObj = '1'), (obj = 'core.USP_GetDropServ');
  // }

  // //nb attualmente i filters non sono gestiti. Non è gestito quindi il cascade
  // GetDropdownValues(
  //   obj,
  //   opt.MagicFormExtension.custDataSource.field,
  //   opt.MagicFormExtension.custDataSource.text,
  //   opt.MagicFormExtension.custDataSource.schema,
  //   opt.MagicFormExtension.custDataSource.typeofdatasource
  //     ? opt.MagicFormExtension.custDataSource.typeofdatasource
  //     : typObj,
  //   filters,
  //   true
  // ).then(function(res) {
  //   if (input) {
  //     input.titleMap = [];
  //     var values = [];
  //     if (res && scope.requestKeys['' + columnName] == requestKey) {
  //       $.each(res, function(k, v) {
  //         var val = parseInt(v.value);
  //         input.titleMap.push({
  //           value: val,
  //           name: v.text,
  //         });
  //         values.push(val);
  //       });
  //     }
  //     var i = 0;
  //     while (i < scope.model['' + columnName].length) {
  //       if (values.indexOf(parseInt(scope.model['' + columnName][i])) == -1)
  //         //  scope.model[''+columnName].splice(i, 1);
  //         scope.model['' + columnName].splice(i, 1);
  //       else i++;
  //     }
  //   }
  //   $timeout(function() {
  //     scope.$broadcast('schemaFormRedraw');
  //   }, 0);
  // });
}
function populateWizardOptionsCascade(
  value,
  formItems,
  scope,
  element,
  $timeout,
  columnName
) {
  var input = getInputItem(formItems, columnName),
    filters = null,
    requestKey =
      new Date().getTime() +
      "-" +
      Math.random()
        .toString(36)
        .substring(7),
    opt = getOptItem(scope, columnName),
    cascadeOpt = getWizardCascadeColNew(scope, columnName),
    colCascadeOpt = getWizardFilterColNew(scope, columnName);

  if (colCascadeOpt) {
    var inputCasc = getInputItem(formItems, colCascadeOpt.ColumnName),
      fileterCasc = null;

    if (inputCasc && value) {
      var fileterCasc = {
        field:
          colCascadeOpt.MagicFormExtension.custDataSource
            .CascadeFilterColumnName,
        operator: "eq",
        value: value.join(","),
      };

      inputCasc.titleMap = [];
      //da inserire il typedatasource in configurazione per renderlo generico
      GetDropdownValues(
        colCascadeOpt.MagicFormExtension.custDataSource.view,
        colCascadeOpt.MagicFormExtension.custDataSource.field,
        colCascadeOpt.MagicFormExtension.custDataSource.text,
        colCascadeOpt.MagicFormExtension.custDataSource.schema,
        colCascadeOpt.MagicFormExtension.custDataSource.typeofdatasource,
        fileterCasc,
        true
      ).then(function(res) {
        // if (inputCasc.titleMap)
        inputCasc.titleMap = [];
        var values = [];
        if (res.length == 0) scope.model["TK_REFSER_TK_SERVIC_ID"] = [];
        $.each(res, function(k, v) {
          var val = parseInt(v.value);
          inputCasc.titleMap.push({
            value: v.value,
            name: v.text,
          });
          /*
                    inputCasc.titleMap.push({
                      value: v[colCascadeOpt.MagicFormExtension.custDataSource.field],
                      name: v[colCascadeOpt.MagicFormExtension.custDataSource.text],
                    });
                    */
          values.push(val);
          var i = 0;
          /*   while (i < scope.model["" + colCascadeOpt.ColumnName].length) {
                        if (
                          values.indexOf(
                            parseInt(scope.model["" + colCascadeOpt.ColumnName][i])
                          ) == -1
                        )
                          //  scope.model[''+columnName].splice(i, 1);
                          scope.model["" + colCascadeOpt.ColumnName].splice(i, 1);
                        else i++;
                      } */
        });

        $timeout(function() {
          scope.$broadcast("schemaFormRedraw");
        }, 10);
      });
    }
  }
  scope.requestKeys["" + columnName] = requestKey;
  scope.model["" + columnName] = scope.model["" + columnName] || [];
  if (!$.isArray(scope.model["" + columnName]))
    scope.model["" + columnName] = [scope.model["" + columnName]];

  if (cascadeOpt) {
    filters =
      scope.model[
        "" + cascadeOpt.MagicFormExtension.custDataSource.cascadeFromCol
      ].length > 0
        ? {
            field: cascadeOpt.MagicFormExtension.custDataSource.cascadeFromCol,
            operator: "eq",
            value: scope.model[
              "" + cascadeOpt.MagicFormExtension.custDataSource.cascadeFromCol
            ].join(","),
          }
        : null;
    typObj = "1";
    obj = "core.USP_GetDropServ";
    //         //nb attualmente i filters non sono gestiti. Non è gestito quindi il cascade
  }

  var typObj = opt.MagicFormExtension.custDataSource.stored ? "1" : "2";
  var obj = opt.MagicFormExtension.custDataSource.stored
    ? opt.MagicFormExtension.custDataSource.stored
    : opt.MagicFormExtension.custDataSource.view;

  if (columnName == "TK_REFSER_TK_SERVIC_ID") {
    (typObj = "1"), (obj = "core.USP_GetDropServ");
  }

  //nb attualmente i filters non sono gestiti. Non è gestito quindi il cascade
  GetDropdownValues(
    obj,
    opt.MagicFormExtension.custDataSource.field,
    opt.MagicFormExtension.custDataSource.text,
    opt.MagicFormExtension.custDataSource.schema,
    opt.MagicFormExtension.custDataSource.typeofdatasource
      ? opt.MagicFormExtension.custDataSource.typeofdatasource
      : typObj,
    filters,
    true
  ).then(function(res) {
    if (input) {
      input.titleMap = [];
      var values = [];
      if (res && scope.requestKeys["" + columnName] == requestKey) {
        $.each(res, function(k, v) {
          var val = parseInt(v.value);
          input.titleMap.push({
            value: val,
            name: v.text,
          });
          values.push(val);
        });
      }
      var i = 0;
      while (i < scope.model["" + columnName].length) {
        if (values.indexOf(parseInt(scope.model["" + columnName][i])) == -1)
          //  scope.model[''+columnName].splice(i, 1);
          scope.model["" + columnName].splice(i, 1);
        else i++;
      }
    }
    $timeout(function() {
      scope.$broadcast("schemaFormRedraw");
    }, 0);
  });
}

function removeGridButton(gridID) {
  //save
  $("." + gridID)
    .find(".k-grid-toolbar")
    .find(".k-grid-save-changes")
    .remove();
  //cancel
  $("." + gridID)
    .find(".k-grid-toolbar")
    .find(".k-grid-cancel-changes")
    .remove();
  $("." + gridID)
    .find(".k-grid-toolbar")
    .find(".k-grid-add")
    .remove();
  $("." + gridID)
    .find(".k-grid-toolbar")
    .find(".assocman")
    .remove();
}

function closeAllCell(container, options) {
  var grid = container.closest(".k-grid").data("kendoGrid");
  grid.closeCell();
}

function disableInCellEditor(container, options) {
  var model = options.model;
  var state = JSON.parse(model.JSON_STATUS);
  var jqGrid = container.closest("[data-role=grid]");
  var grid = jqGrid.data("kendoGrid");

  var celleditor = window.kendoUploadInCellEditor;

  if (state.closeCell == "1") {
    container.css({ "pointer-events": "none" });
    kendoConsole.log("Il file risulta trasmesso ed è quindi criptato ", "info");
    grid.closeCell();
  } else celleditor(container, options);

  console.log("passo");
}

function enpamDocAlboInCellEditor(container, options) {
  // kendoUploadInCellEditor
  var model = options.model;
  var state = JSON.parse(model.JSON_STATUS);
  var jqGrid = container.closest("[data-role=grid]");
  var grid = jqGrid.data("kendoGrid");

  var celleditor = window.kendoUploadInCellEditor;

  if (
    state.sr_regsta_flag_suspended == "1" ||
    state.sr_regsta_flag_renewing == "1"
  ) {
    if (
      typeof model.DO_DOCVER_LINK_FILE == "undefined" ||
      model.DO_DOCVER_LINK_FILE == null
    ) {
      celleditor(container, options);
      //  grid.closeCell();
      return;
    } else {
      grid.closeCell();
      return;
    }
  } else if (
    state.SR_REGSTA_FLAG_ACTIVE == "1" ||
    state.SR_REGSTA_FLAG_EXPIRED == "1"
  ) {
    grid.closeCell();
    return;
  } else celleditor(container, options);

  console.log("changeWizard");
}

function kendoUploadInCellEditorR3(container, options) {
  var $grid = container.closest("[data-role=grid]"),
    grid = $grid.data("kendoGrid"),
    uploadInfo =
      grid.dataSource.options.schema.model.fields[options.field].uploadInfo,
    $input = $(
      '<input name="' +
        options.field +
        '" type="file" data-savepath="' +
        uploadInfo.savePath +
        '" data-admin-upload="' +
        uploadInfo.adminUpload +
        '" accept="' +
        uploadInfo.fileExtensions +
        '"' +
        (grid.dataSource.options.schema.model.fields[options.field].validation
          .required
          ? ' required="required"'
          : "") +
        " />"
    ),
    data = {
      files: options.model[options.field]
        ? options.model[options.field].match(/^\[{/)
          ? JSON.parse(options.model[options.field])
          : [{ name: options.model[options.field] }]
        : [],
      multiple: uploadInfo.isMulti,
    };

  $input.appendTo(container);
  initKendoUploadFieldR3($input, data, $grid, options.model.uid);
}

function genericToolbarButtonFunctionR3(e, options) {
  var removeReservedWordsFromPayload = function(jsonpayload) {
    if (!jsonpayload) return jsonpayload;
    var payloadForExtension = $.extend({}, jsonpayload);
    delete payloadForExtension.form;
    delete payloadForExtension.formLoadSp;
    delete payloadForExtension.storedProcedure;
    delete payloadForExtension.selectionMandatory;
    delete payloadForExtension.formWide;
    delete payloadForExtension.formHideTabs;
    return payloadForExtension;
  };
  var getGridData = function(targetgrid, jsonpayload) {
    var datapayload = [];
    //append the payloads to selection removing front end reserved words
    var payloadForExtension = removeReservedWordsFromPayload(jsonpayload);
    //if the grid is NOT selectable then i'm going to pick the all the rows. If the dirty flag is set to true i'm picking the modified ones only
    if (targetgrid.options && !targetgrid.options.selectable) {
      var datapayload = $.map(targetgrid.dataSource.data(), function(v, i) {
        if (
          !jsonpayload ||
          (jsonpayload && jsonpayload.dirty && v.dirty) ||
          (jsonpayload && !jsonpayload.dirty)
        )
          //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
          return jQuery.extend({}, v, payloadForExtension);
        else return;
      });
    } //selectable return selected rows
    else {
      //select all from database
      if (targetgrid.element.data("allRecords")) {
        return $.map(targetgrid.element.data("allRecords"), function(v, i) {
          return jQuery.extend({}, v, payloadForExtension);
        });
      }
      //select all in current browser view
      var selecteddata = targetgrid.select();
      if (detectTouch() && targetgrid.element.find(".rowselected__").length) {
        selecteddata = [];
        $.each(targetgrid.element.find(".rowselected__"), function(i, v) {
          if ($(v).prop("checked") == true)
            selecteddata.push($(v).closest("tr"));
        });
      }

      if (selecteddata.length > 0) {
        for (var i = 0; i < selecteddata.length; i++) {
          //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
          datapayload.push(
            jQuery.extend(
              {},
              targetgrid.dataItem(selecteddata[i]),
              payloadForExtension
            )
          );
        }
      }
    }
    //clear useless props
    $.each(datapayload, function(i, v) {
      if ("defaults" in v) delete v.defaults;
      if ("fields" in v) delete v.fields;
      if ("_defaultId" in v) delete v._defaultId;
    });

    return datapayload;
  };

  var key = e.id == "" ? e.className : e.id;
  var storedprocedure =
    options && options.storedprocedure
      ? options.storedprocedure
      : toolbarbuttonattributes[key].storedprocedure;
  var storedproceduredataformat =
    options && options.storedproceduredataformat
      ? options.storedproceduredataformat
      : toolbarbuttonattributes[key].storedproceduredataformat;
  var targetgrid = getGridFromToolbarButton(e);
  var jsonpayload = {};
  try {
    jsonpayload =
      options && options.payload
        ? options.payload
        : JSON.parse(toolbarbuttonattributes[key].jsonpayload);
  } catch (e) {
    console.log("jsonpayload is not a valid json:" + e.message);
  }
  //se la griglia e' selezionabile vado a prendermi tutte le righe selezionate se non e' selezionabile tutte le dirty rows
  var datapayload = [];
  try {
    datapayload = getGridData(targetgrid, jsonpayload);
  } catch (err) {
    console.log(err);
  }
  if (jsonpayload && jsonpayload.selectionMandatory && !datapayload.length) {
    kendoConsole.log(getObjectText("selectatleastone"), true);
    return;
  }

  var url = "/api/GENERICSQLCOMMAND/ActionButtonSPCall/";
  if (jsonpayload && jsonpayload.CustomControllerAPI) {
    url = jsonpayload.CustomControllerAPI;
  }

  //crea lo stesso payload del caso batch dell' update
  var datatopost = buildGenericPostInsertUpdateParameter(
    "customaction",
    storedprocedure,
    null,
    storedprocedure,
    storedproceduredataformat,
    sessionStorage.fid ? sessionStorage.fid : null,
    null,
    { models: datapayload },
    null
  );
  rebuildGenericModal();
  //if the form property is set a form is used via magicform directive
  if (
    jsonpayload &&
    (jsonpayload.form || jsonpayload.formMassiveUpdate == true)
  ) {
    genericButtonForm({
      e: e,
      datatopost: datatopost,
      jsonpayload: jsonpayload,
      targetgrid: targetgrid,
      storedprocedure: storedprocedure,
    });
  } else {
    $("#executesave").click(function() {
      doModal(true);
      var data = JSON.parse(datatopost);
      $(data.models).each(function(k, v) {
        $.each(v, function(key, val) {
          if (
            typeof val == "string" &&
            val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
          )
            v[key] = toTimeZoneLessString(new Date(val));
        });
      });

      requireConfigAndMore(["MagicSDK"], function(MF) {
        MF.api
          .get({
            storedProcedureName: data.cfgEntityName,
            models: data.models,
          })
          .then(
            function(result) {
              var msg = "OK";
              var msgtype = false;

              if (result[0][0].message !== undefined) {
                msg = result[0][0].message;
                if (result.msgtype == "WARN") msgtype = "info";
              }
              if (jsonpayload && jsonpayload.CallbackFunction) {
                window[jsonpayload.CallbackFunction](result);
              }
              kendoConsole.log(msg, msgtype);
              targetgrid.dataSource.read();
              doModal(false);
              $("#wndmodalContainer").modal("hide");
            },
            function(err) {
              //kendoConsole.log(err.responseText, true);
              doModal(false);
            }
          );
      });

      //$.ajax({
      //    type: "POST",
      //    url: url,
      //    timeout: 250000,
      //    data: JSON.stringify(data),
      //    contentType: "application/json; charset=utf-8",
      //    dataType: "json",
      //    success: function (result) {
      //        var msg = "OK";
      //        var msgtype = false;
      //        if (result.message !== undefined) {
      //            msg = result.message;
      //            if (result.msgtype == "WARN")
      //                msgtype = "info";
      //        }
      //        if (jsonpayload && jsonpayload.CallbackFunction) {
      //            window[jsonpayload.CallbackFunction](result);
      //        }
      //        kendoConsole.log(msg, msgtype);
      //        targetgrid.dataSource.read();
      //        doModal(false);
      //        $("#wndmodalContainer").modal('hide');
      //    },
      //    error: function (message) {

      //        kendoConsole.log(message.responseText, true);
      //        doModal(false);
      //    }
      //});
    });

    $("#wndmodalContainer").modal("show");
  }
}

function quarefChange(e) {
  e.container = [$(e.sender.wrapper).closest(".k-edit-form-container")];
  var kendoEditable = $(e.container[0])
    .parent()
    .data("kendoEditable");
  var tabStrip = $("grid-form")
    .find("div[data-role='tabstrip']")
    .kendoTabStrip()
    .data("kendoTabStrip");

  if (tabStrip != undefined && tabStrip.tabGroup) {
    switch (kendoEditable.options.model.SR_QUALIF_SR_SECTIO_ID) {
      case 2:
        tabStrip.tabGroup
          .children()
          .eq(0)
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(0)
          .parent()
          .parent()
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(1)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(2)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(3)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(0)
          .click();
        $("span:contains(Fatturato Specifico)").trigger("click");
        //chiudo il tooltip
        setTimeout(function() {
          $("div.k-animation-container")
            .children()
            .children("div.k-tooltip-button")
            .children()
            .trigger("click");
        }, 3000);
        break;

      case 1:
        tabStrip.tabGroup
          .children()
          .eq(0)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(0)
          .parent()
          .parent()
          .attr("style", "display:none");

        tabStrip.tabGroup
          .children()
          .eq(1)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(2)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(3)
          .attr("style", "display:none");
        $("span:contains(Fatturato Specifico)").trigger("click");
        setTimeout(function() {
          $("div.k-animation-container")
            .children()
            .children("div.k-tooltip-button")
            .children()
            .trigger("click");
        }, 3000);
        break;
      case 3:
        tabStrip.tabGroup
          .children()
          .eq(0)
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(1)
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(0)
          .parent()
          .parent()
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(2)
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(3)
          .attr("style", "display:true");
        $("span:contains(Fatturato Specifico)").trigger("click");
        setTimeout(function() {
          $("div.k-animation-container")
            .children()
            .children("div.k-tooltip-button")
            .children()
            .trigger("click");
        }, 3000);
        break;
      case 4:
        tabStrip.tabGroup
          .children()
          .eq(0)
          .attr("style", "display:none");
        tabStrip.tabGroup
          .children()
          .eq(0)
          .parent()
          .parent()
          .attr("style", "display:true");
        tabStrip.tabGroup
          .children()
          .eq(1)
          .attr("style", "display:true");

        tabStrip.tabGroup
          .children()
          .eq(1)
          .click();

        tabStrip.tabGroup
          .children()
          .eq(2)
          .attr("style", "display:none");
        $("span:contains(Fatturato Totale)").trigger("click");
        setTimeout(function() {
          $("div.k-animation-container")
            .children()
            .children("div.k-tooltip-button")
            .children()
            .trigger("click");
        }, 3000);

        break;
    }
  }

  console.log(e);
}

function initKendoUploadFieldR3($input, options, $container, uid) {
  var inputData = $input.data(),
    path = managesavepath(inputData.savepath) || "",
    useController = false;

  if (!inputData.adminUpload) {
    useController =
      window.getMSSQLFileTable ||
      window.FileUploadRootDir ||
      !path.match(/^\//);
  } else if (!path) {
    useController = true; //is adminUpload and no savepath is set, use controller to get filedir from DB
  } else {
    path = ""; //is adminUpload and savepath is set, so clear savepath -> saved in filename
  }

    let saveUrl = "/api/MAGIC_SAVEFILE/SaveApplication";
    //FIX FOR COMUNE DI ROMA !!!!  
    if (window.synchCallsApiPrefix) 
        saveUrl = window.synchCallsApiPrefix + saveUrl;

  var data = $.extend(
    {
      async: {
        saveUrl,
        removeUrl: "/api/MAGIC_SAVEFILE/RemoveApplication",
        removeVerb: "GET",
      },
      select: onUploadSelect,
      template: function(e) {
        return uploadTemplate(
          e,
          path,
          useController,
          inputData.adminUpload,
          true,
          $container ? $container.attr("gridname") : null,
          $input.attr("name")
        );
      },
      upload: onUpload,
      success: function(e) {
        uploadSuccess(e, $container, uid, inputData.adminUpload);
      },
      validation: {
        allowedExtensions: $input.attr("accept")
          ? $input.attr("accept").split(",")
          : [],
        maxFileSize: window.MaxRequestLength * 1024, //MaxRequestLength is in KB https://msdn.microsoft.com/de-de/library/system.web.configuration.httpruntimesection.maxrequestlength(v=vs.110).aspx
      },
    },
    options,
    inputData
  );

  $.each(data, function(k, v) {
    if (typeof v == "string") {
      if (typeof window[v] == "function") data[k] = eval(v);
      else if (v.toLowerCase() == "true") data[k] = true;
      else if (v.toLowerCase() == "false") data[k] = false;
    }
  });

  data.localization = {
    select: getObjectText("selectFile"),
    remove: getObjectText("remove"),
    retry: getObjectText("retry"),
    headerStatusUploaded: getObjectText("done"),
    headerStatusUploading: getObjectText("uploading"),
  };

  if (options.localization)
    data.localization = $.extend(data.localization, options.localization);

  var kendoUpload = $input.kendoUpload(data).data("kendoUpload");

  if (options.gallery && options.files && options.files.length) {
    var button = $(
      '<div class="k-button k-upload-button"><i class="fa fa-picture-o" aria-hidden="true"></i></div>'
    );
    kendoUpload.wrapper.find(".k-dropzone").append(button);
    button.on("click", function(e) {
      e.preventDefault();
      showModal({
        content: getGalleryHtml(options.files),
        title: '<i class="fa fa-picture-o" aria-hidden="true"></i>',
        wide: true,
      });
    });
  }

  return kendoUpload;
}
function invoiceEverything(e) {
  var uid = $(e)
    .closest("tr")
    .data("uid");
  var kendoGrid = $(e)
    .closest(".k-grid")
    .data("kendoGrid");
  var item = kendoGrid.dataSource.getByUid(uid);
  //checkboxClicked(e, 'CONSUNTIVA_TUTTO');
  item.set("CONSUNTIVA_TUTTO", e.checked);
  if (e.checked) {
    item.set("IMPORTO_DA_CONSUNTIVARE", item.RESIDUO);
    if (item.TK_INVROW_AC_TIPVAT_ID) {
      requireConfigAndMore(["MagicSDK"], function(MF) {
        MF.api
          .get({
            storedProcedureName: "core.TKN_SP_TIPVAT_L_FOR_CONSTRAINT",
            data: {
              TK_INVROW_AC_TIPVAT_ID: item.TK_INVROW_AC_TIPVAT_ID,
              TK_INVROW_AC_TIPHOL_ID: item.TK_INVROW_AC_TIPHOL_ID,
              TK_INVROW_AC_TIPHOL_ID_PREV: item.TK_INVROW_AC_TIPHOL_ID_PREV,
            },
          })
          .then(function(res) {
            if (res && res.length && res[0].length) {
              //item.TK_INVROW_TAX = (item.IMPORTO_DA_CONSUNTIVARE * res[0][0].AC_HISVAT_PERC) / 100;
              item.set(
                "TK_INVROW_TAX",
                (item.IMPORTO_DA_CONSUNTIVARE * res[0][0].AC_HISVAT_PERC) / 100
              );
              item.set(
                "TK_INVROW_TK_INVHOL_AMOUNT",
                (item.IMPORTO_DA_CONSUNTIVARE * res[0][0].AC_TIPHOL_PERC) / 100
              );
              item.set(
                "TK_INVROW_TK_INVHOL_AMOUNT_PREV",
                (item.IMPORTO_DA_CONSUNTIVARE * res[0][0].AC_TIPHOL_PERC_PREV) /
                  100
              );
              item.set(
                "TK_INVROW_TK_INVHOL_TAX_PREV",
                (((item.IMPORTO_DA_CONSUNTIVARE *
                  res[0][0].AC_TIPHOL_PERC_PREV) /
                  100) *
                  res[0][0].AC_HISVAT_PERC) /
                  100
              );
            }
          });
      });
    }
  } else {
    item.set("IMPORTO_DA_CONSUNTIVARE", null);
    item.set("TK_INVROW_TAX", 0);
    item.set("TK_INVROW_TK_INVHOL_AMOUNT", 0);
    item.set("TK_INVROW_TK_INVHOL_AMOUNT_PREV", 0);
    item.set("TK_INVROW_TK_INVHOL_TAX_PREV", 0);
  }
}

function reportToHelpDesk(el) {
  var $window = $(
    '<div class="k-popup-edit-form">\
        <form class="k-edit-form-container">\
            <div class="k-tabstrip-wrapper">\
                <div class="k-tabstrip">\
                    <ul class="k-tabstrip-items k-reset"></ul>\
                    <div class="k-content k-state-active" style="display: block;">\
                        <div class="row col-12-form">\
                            <div class="col-sm-12">\
                                <div class="k-edit-label"><label for="help-desk-type">' +
      getObjectText("type") +
      '</label></div>\
                                <div class="k-edit-field"><input id="help-desk-type" required></div>\
                            </div>\
                            <div class="col-sm-12">\
                                <div class="k-edit-label"><label for="help-desk-description">' +
      getObjectText("description") +
      '</label></div>\
                                <div class="k-edit-field"><textarea id="help-desk-description" rows="5" class="k-input k-textbox" required></textarea></div>\
                            </div>\
                            <div class="col-sm-12">\
                                <div class="k-edit-label"><label for="help-desk-files">' +
      getObjectText("files") +
      '</label></div>\
                                <div class="k-edit-field"><input type="file" id="help-desk-files" class="k-input k-textbox"   accept=".png,.jpg,.jpeg,.mp4,.avi,.pdf,.xls,.xlsx,.doc,.docx,.zip,.rar" /></div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
            <div class="k-edit-buttons k-state-default"><button type="submit" class="k-primary k-button">Save changes</button></div>\
        </form>\
    </div>'
  ).kendoWindow({
    width: "500px",
    title: getObjectText("reportError"),
  });

  var kendoWindow = $window
    .data("kendoWindow")
    .open()
    .center();

  initKendoUploadField(
    $("#help-desk-files", $window),
    { multiple: false },
    $window
  );
  var gridName = $(el)
    .closest("[gridname]")
    .attr("gridname");
  var dropDown = $("#help-desk-type", $window)
    .kendoDropDownList({
      dataTextField: "SG_TIPREQ_DESCRIPTION",
      dataValueField: "SG_TIPREQ_ID",
      dataSource: {
        transport: {
          read: {
            url: "/api/HelpDesk/Types",
          },
        },
      },
    })
    .data("kendoDropDownList");

  $("form", $window).submit(function(e) {
    e.preventDefault();
    doModal(true);
    $.post("/api/HelpDesk/Post", {
      typeID: dropDown.value(),
      description: $("#help-desk-description", $window).val(),
      url: location.href,
      gridName: gridName,
      files: $("#help-desk-files", $window).data("kendoUpload").options.files,
      rawFiles: $window.data("filesToSave"),
    }).then(
      function(res) {
        doModal(false);
        kendoConsole.log("Segnalazione inserita con successo", false);
        kendoWindow.close();
      },
      function(res) {
        doModal(false);
        kendoConsole.log(res.responseText, true);
      }
    );
  });
}

function getStars(rating, stars) {
  // Round to nearest half
  rating = Math.round(rating * 2) / 2;
  let output = [];

  if (stars == null || stars == undefined) stars = 5;

  // Append all the filled whole stars
  for (var i = rating; i >= 1; i--)
    output.push(
      '<i class="fa fa-star" aria-hidden="true" style="color: gold;"></i>&nbsp;'
    );

  // If there is a half a star, append it
  if (i == 0.5)
    output.push(
      '<i class="fa fa-star-half-o" aria-hidden="true" style="color: gold;"></i>&nbsp;'
    );

  // Fill the empty stars
  for (let i = stars - rating; i >= 1; i--)
    output.push(
      '<i class="fa fa-star-o" aria-hidden="true" style="color: gold;"></i>&nbsp;'
    );

  return output.join("");
}

function detailVendorData(el) {
  if ($("#vendordetail").length)
    $("#vendordetail")
      .data("kendoWindow")
      .destroy();

  var $window = $(
    '<div id="vendordetail" class="k-popup-edit-form">\
        <form class="k-edit-form-container">\
            <div class="k-tabstrip-wrapper">\
                <div class="k-tabstrip">\
                    <ul class="k-tabstrip-items k-reset"></ul>\
                    <div class="k-content k-state-active" style="display: block;">\
                        <div class="row col-12-form">\
                        <div id="gridinlist"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </form>\
    </div>'
  ).kendoWindow({
    width: "1000px",
    title: el.LE_CARREF_DESCRIPTION,
  });

  var gridtoopenname = el.LE_CARREF_GRIDNAME; //da cambiare
  if (gridtoopenname == null || gridtoopenname == undefined) return;

  var kendoWindow = $window
    .data("kendoWindow")
    .open()
    .center();

  requireConfigAndMore(["MagicSDK"], function(MF) {
    MF.kendo
      .getGridObject({
        gridName: gridtoopenname,
      })
      .then(function(gridobj) {
        var campo;
        var filters = JSON.parse(el.LE_CARREF_ActionFilter);
        if (filters && filters != null && !Array.isArray(filters)) {
          campo = filters.field.toUpperCase();

          if (campo.indexOf("SUPREG") > -1) filters.value = el.SR_SUPREG_ID;
          else if (campo.indexOf("REFERE") > -1)
            filters.value = el.LE_REFERE_ID;
        } else if (filters && filters != null && Array.isArray(filters)) {
          for (let index = 0; index < filters.length; index++) {
            const element = filters[index];
            campo = element.field.toUpperCase();

            if (campo.indexOf("SUPREG") > -1)
              filters[index].value = el.SR_SUPREG_ID;
            else if (campo.indexOf("REFERE") > -1)
              filters[index].value = el.LE_REFERE_ID;
          }
        }

        gridobj.dataSource.filter = filters;
        MF.kendo.appendGridToDom({
          kendoGridObject: gridobj,
          selector: "gridinlist",
        });

        setTimeout(function() {
          sessionStorage.selectedGridsSettings = "";
        }, 1000);
      });
  });
}

//L.A. corretto errore su dispatcher ( the variable is defined)
//S.ME
//if (jQuery.isEmptyObject(processiIncassiResiduals)) {
if (!processiIncassiResiduals) {
  var processiIncassiResiduals = {};
  var processiIncassiTotalFieldNames = ["AC_ANAPAY_VALUE", "AC_PAYMEN_VALUE"];
}

function wizardOnChangeProcessiIncassi(
  value,
  formItems,
  scope,
  element,
  $timeout,
  columnName,
  event
) {
  if (event === undefined) {
    return;
  }

  const gridData = event.sender.data();
  var wizardScope = getWizardScope(scope);
  const totalFieldName = Object.keys(wizardScope.models.pay001).find((k) =>
    processiIncassiTotalFieldNames.includes(k)
  );
  const total = wizardScope.models.pay001[totalFieldName];
  let residual = total;
  for (let i = 0; i < gridData.length; i++) {
    const row = gridData[i];
    residual -= row.TOT_DA_ATTRIB_PRE_TAX;
  }
  if (!("pay003" in wizardScope.models)) {
    processiIncassiResiduals = {};
    wizardScope.models.pay003 = {};
  }
  processiIncassiResiduals[columnName] = residual;
  for (const [key, value] of Object.entries(processiIncassiResiduals)) {
    if (columnName === key) {
      continue;
    }
    residual -= total - value;
  }
  for (const [key, value] of Object.entries(wizardScope.models)) {
    if (key === "pay001") {
      continue;
    }
    value[totalFieldName] = residual.toFixed(2);
  }
  $timeout();
}

function srSendAll(e, scope) {
  var input = $("#To");

  if (e) {
    input.val("everyone");
    input.attr("readonly", true);
    input.trigger("input");
  } else {
    input.val("");
    input.attr("readonly", false);
    input.trigger("input");
  }

  return;
}
/**
 * Kendo-style semaphore indicator.
 *  – containerSelector omitted → returns HTML string (off-DOM)
 *  – containerSelector given   → injects widget and returns control object
 *    { setValue, setTitle, destroy }
 */
function initKendoSemaforo({
    containerSelector,
    titleSelector = null,
    initialValue = 0,
    width = 60,
    height = 24,
    responsive = false,
    throttleMs = 100
} = {}) {
    const $ = window.jQuery;

    /* ---------- helpers ---------- */
    const toCssSize = v => (v == null ? "" : (typeof v === "number" ? `${v}px` : String(v)));
    const clamp = v => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;
    };
    const levelOf = v => (v >= 4 ? "g" : (v >= 2.5 ? "y" : "r"));

    /* ---------- build HTML (off-DOM) ---------- */
    function buildHtml(value) {
        const lvl = levelOf(value);
        const wrap = document.createElement("div");
        wrap.style.cssText = `width:${toCssSize(width)};height:${toCssSize(height)};display:flex;align-items:center;justify-content:center;gap:6px;`;

        ["r", "y", "g"].forEach(color => {
            const dot = document.createElement("span");
            dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#3a3a3a;";
            if (color === lvl) {
                const cssColor = { r: "#ff3b30", y: "#ffd60a", g: "#34c759" }[color];
                dot.style.background = cssColor;
                dot.style.boxShadow = `0 0 8px ${cssColor}`;
            }
            wrap.appendChild(dot);
        });
        return wrap.outerHTML;
    }

    /* ---------- RAMO 1 : nessun container → ritorna HTML ---------- */
    if (!containerSelector) return buildHtml(initialValue);

    /* ---------- RAMO 2 : attacca al DOM ---------- */
    const $container = $(containerSelector);
    if (!$container.length) {
        console.warn("initKendoSemaforo: container non trovato", containerSelector);
        return null;
    }

    // inietta struttura
    $container.html(buildHtml(initialValue));
    const $title = titleSelector ? $(titleSelector) : null;

    /* ---------- API ---------- */
    function setValue(v) {
        const val = clamp(v);
        $container.html(buildHtml(val));
        if ($title && $title.length) $title.text(val.toFixed(2));
    }
    function setTitle(text) {
        if ($title && $title.length) $title.text(String(text ?? ""));
    }
    function destroy() {
        $container.empty();
    }

    /* ---------- (opzionale) responsività ---------- */
    let ro = null, timer = null;
    if (responsive && typeof ResizeObserver !== "undefined") {
        const target = $container[0];
        ro = new ResizeObserver(() => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => { /* qui potresti ridisegnare */ }, throttleMs);
        });
        ro.observe(target);
    }

    return { setValue, setTitle, destroy };
}
function initKendoRadialGauge({
    gaugeSelector,           // es. "#gauge" (ORA FACOLTATIVO)
    titleSelector = null,

    // --- dimensioni ---
    width = 220,
    height = 180,
    responsive = false,
    containerSelector = null,
    throttleMs = 100,

    // --- scala/valori ---
    initialValue = Number(e.Evaluetion),
    min = 0,
    max = 5,
    startAngle = 0,
    endAngle = 180,
    majorUnit = 1,
    minorUnit = 0.1,
    ranges = [
        { from: 0, to: 2.49, color: "#c20000" },
        { from: 2.5, to: 3.99, color: "#ffd966" },
        { from: 4.0, to: 5, color: "#6aa84f" }
    ],
} = {}) {
    const $ = window.jQuery;

    const kendoReady =
        !!($ &&
            window.kendo &&
            window.kendo.dataviz &&
            typeof $.fn.kendoRadialGauge === "function");

    if (!kendoReady) {
        console.warn("Kendo UI Dataviz non disponibile.");
        return null;
    }

    // utilità: coercizione dimensioni
    const toCssSize = (v) => (v == null ? "" : (typeof v === "number" ? `${v}px` : String(v)));

    // --- RAMO 1: gaugeSelector NON passato -> ritorna HTML del componente ----

    if (!gaugeSelector) {
        const $wrap = $('<div>');
        const $gauge = $('<div>')
            .css({ width: toCssSize(width), height: toCssSize(height) });

        $gauge.kendoRadialGauge({
            pointer: { value: Number(initialValue) },
            scale: { minorUnit, majorUnit, startAngle, endAngle, min, max, ranges }
        });

        const tmp = $gauge.data('kendoRadialGauge');
        tmp.resize(true);               // <-- forces synchronous re-render

        $wrap.append($gauge);
        const html = $wrap.html();      // SVG now contains pointer at value 3
        tmp.destroy();
        return html;
    }

    // --- RAMO 2: gaugeSelector passato -> comportamento originale ------------
    const $gauge = $(gaugeSelector);
    $gauge.empty();           // <-- remove any previous SVG
    $gauge.kendoRadialGauge({
        pointer: { value: Number(initialValue) },
        scale: { minorUnit, majorUnit, startAngle, endAngle, min, max, ranges }
    });

    // applica dimensioni all'elemento
    function applySize(w, h) {
        if (w != null) $gauge.css("width", toCssSize(w));
        if (h != null) $gauge.css("height", toCssSize(h));
    }

    // 1) imposta dimensioni iniziali
    applySize(width, height);

    // 2) istanzia gauge
    $gauge.kendoRadialGauge({
        pointer: { value: initialValue || 0 },
        scale: { minorUnit, majorUnit, startAngle, endAngle, min, max, ranges }
    });

    const widget = $gauge.data("kendoRadialGauge");

    // --- API di utilità ------------------------------------------------------
    function clamp(v) {
        const n = Number(v);
        if (!Number.isFinite(n)) return min;
        return Math.max(min, Math.min(max, n));
    }

    function setValue(v) {
        if (!widget) return;
        widget.value(clamp(v));
    }

    function setTitle(text) {
        if (!titleSelector) {
            // in mancanza di un titolo esterno, salvo comunque su title attribute
            $gauge.attr("title", String(text ?? ""));
            return;
        }
        const $title = $(titleSelector);
        if ($title && $title.length) $title.text(String(text ?? ""));
        $gauge.attr("title", String(text ?? ""));
    }

    function updateScale(partialScaleOptions = {}) {
        if (!widget) return;
        const current = widget.options.scale || {};
        widget.setOptions({ scale: { ...current, ...partialScaleOptions } });
    }

    function setSize(newWidth, newHeight) {
        applySize(newWidth, newHeight);
        if (widget && typeof widget.resize === "function") widget.resize();
    }

    // --- Responsività con ResizeObserver ------------------------------------
    let ro = null;
    let resizeTimer = null;

    function onResizeObserved() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (widget && typeof widget.resize === "function") widget.resize();
        }, throttleMs);
    }

    if (responsive && typeof ResizeObserver !== "undefined") {
        const elToObserve = containerSelector ? $(containerSelector)?.get(0) : $gauge.get(0);
        if (elToObserve) {
            ro = new ResizeObserver(onResizeObserved);
            ro.observe(elToObserve);
            onResizeObserved();
        }
    }

    function destroy() {
        if (ro) {
            try { ro.disconnect(); } catch { /* noop */ }
            ro = null;
        }
        if (widget) widget.destroy();
    }

    return { widget, setValue, setTitle, updateScale, setSize, destroy };
}


function initKendoSemaforo({
    containerSelector,
    titleSelector = null,
    initialValue = 0,
    width = 60,
    height = 24,
    responsive = false,
    throttleMs = 100
} = {}) {
    const $ = window.jQuery;

    /* ---------- helpers ---------- */
    const toCssSize = v => (v == null ? "" : (typeof v === "number" ? `${v}px` : String(v)));
    const clamp = v => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;
    };
    const levelOf = v => (v >= 4 ? "g" : (v >= 2.5 ? "y" : "r"));

    /* ---------- build HTML (off-DOM) ---------- */
    function buildHtml(value) {
        const lvl = levelOf(value);
        const wrap = document.createElement("div");
        wrap.style.cssText = `width:${toCssSize(width)};height:${toCssSize(height)};display:flex;align-items:center;justify-content:center;gap:6px;`;

        ["r", "y", "g"].forEach(color => {
            const dot = document.createElement("span");
            dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#3a3a3a;";
            if (color === lvl) {
                const cssColor = { r: "#ff3b30", y: "#ffd60a", g: "#34c759" }[color];
                dot.style.background = cssColor;
                dot.style.boxShadow = `0 0 8px ${cssColor}`;
            }
            wrap.appendChild(dot);
        });
        return wrap.outerHTML;
    }

    /* ---------- RAMO 1 : nessun container → ritorna HTML ---------- */
    if (!containerSelector) return buildHtml(initialValue);

    /* ---------- RAMO 2 : attacca al DOM ---------- */
    const $container = $(containerSelector);
    if (!$container.length) {
        console.warn("initKendoSemaforo: container non trovato", containerSelector);
        return null;
    }

    // inietta struttura
    $container.html(buildHtml(initialValue));
    const $title = titleSelector ? $(titleSelector) : null;

    /* ---------- API ---------- */
    function setValue(v) {
        const val = clamp(v);
        $container.html(buildHtml(val));
        if ($title && $title.length) $title.text(val.toFixed(2));
    }
    function setTitle(text) {
        if ($title && $title.length) $title.text(String(text ?? ""));
    }
    function destroy() {
        $container.empty();
    }

    /* ---------- (opzionale) responsività ---------- */
    let ro = null, timer = null;
    if (responsive && typeof ResizeObserver !== "undefined") {
        const target = $container[0];
        ro = new ResizeObserver(() => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => { /* qui potresti ridisegnare */ }, throttleMs);
        });
        ro.observe(target);
    }

    return { setValue, setTitle, destroy };
}

function refreshGridInFunction(grid, e) {
  var deferred = $.Deferred();

  console.log("requestEnd");

  requireConfigAndMore(["MagicSDK"], function(MF) {
    try {
      MF.api
        .get({
          storedProcedureName: "core.usp_ev_ret_grid_in_function_reload",
          data: { gridname: grid.gridcode },
        })
        .then(function(result) {
          if (!result[0]) {
            deferred.reject();
          }

          $.each(result[0], function(i, v) {
            gridChild = $('div[gridname="' + v.child + '"]').data("kendoGrid");
            if (gridChild) {
              gridChild.dataSource.read();
              gridChild.refresh();
            }
          });
          deferred.resolve();
        });
    } catch (ex) {
      console.log("Gestiore refresh in Function" + ex.toString());
      deferred.reject();
    }
  });
}

 function refreshGrid (e){
 var gridName=$("#"+e.id).closest("div[gridname]").attr('gridname');
 grid = $('div[gridname="' + gridName + '"]').data("kendoGrid");
 if(grid)
         grid.dataSource.read();
 }
 
function mandatoryWizardFields(value, formItems, scope, element) {
    var wizardCode = this.options.apiCallData.wizardCode;
    if (wizardCode == 'requesins') {
        var TK_REQREQ_FLAG_MAND_REQUES_RIF = this.options.apiCallData.data.rq001.TK_REQREQ_FLAG_MAND_REQUES_RIF;
        if (TK_REQREQ_FLAG_MAND_REQUES_RIF =="true" && (value == null || value == "" )) {
            return false;
        }
        else
            return true;
    }
    return true;
}

function semaforoKendoInit(id, value, score) {
    if (!id || !Number.isFinite(value) || value <= 0) return;
    const lvl = value >= 4 ? "g" : (value >= 2.5 ? "y" : "r");
    const $k = (window.kendo && window.kendo.jQuery) ? window.kendo.jQuery : window.jQuery;
    const hasKendoBadge = !!($k && $k.fn && typeof $k.fn.kendoBadge === "function");

    const rootId = `semafori-root-${id}`, cId = `semaforo-kendo-${id}`, tId = `semaforo-title-${id}`;
    let root = document.getElementById(rootId);
    if (!root) {
        root = Object.assign(document.createElement("div"), { id: rootId, style: "display:flex;flex-wrap:wrap;gap:16px;justify-content:center" });
        document.body.appendChild(root);
    }
    if (!document.getElementById(cId)) {
        root.insertAdjacentHTML("beforeend",
            `<div id="${cId}" style="padding:8px;display:flex;flex-direction:column;align-items:center;gap:8px">
         <div id="${tId}" style="font:12px/1.2 sans-serif;color:#666">${value}</div>
         <span id="${cId}-r"></span>
         <span id="${cId}-y"></span>
         <span id="${cId}-g"></span>
       </div>`
        );
        // stile base “LED” (così funziona anche senza Badge)
        for (const sid of [`${cId}-r`, `${cId}-y`, `${cId}-g`]) {
            const el = document.getElementById(sid);
            Object.assign(el.style, { width: "28px", height: "28px", borderRadius: "50%", background: "#3a3a3a", display: "block" });
        }
    } else {
        document.getElementById(tId).textContent = String(value);
    }

    if (hasKendoBadge) {
        $k(`#${cId}-r`).kendoBadge({ shape: "circle", fill: "solid", themeColor: lvl === "r" ? "error" : "base", text: "" });
        $k(`#${cId}-y`).kendoBadge({ shape: "circle", fill: "solid", themeColor: lvl === "y" ? "warning" : "base", text: "" });
        $k(`#${cId}-g`).kendoBadge({ shape: "circle", fill: "solid", themeColor: lvl === "g" ? "success" : "base", text: "" });
    } else {
        // fallback CSS: accendi il LED giusto
        const on = (el, color) => { el.style.background = color; el.style.boxShadow = `0 0 8px ${color}`; };
        const off = el => { el.style.background = "#3a3a3a"; el.style.boxShadow = ""; };
        const R = document.getElementById(`${cId}-r`), Y = document.getElementById(`${cId}-y`), G = document.getElementById(`${cId}-g`);
        off(R); off(Y); off(G);
        if (lvl === "r") on(R, "#ff3b30"); else if (lvl === "y") on(Y, "#ffd60a"); else on(G, "#34c759");
    }
    return cId;
}

function launchActionFromToolbar(e) {
    //var jsonpayload = {"actiontype":"NEWGD","actionfilter":{ "field":"TK_CONAMO_TK_CONTRA_ID","operator":"eq","value":"TK_CONTRA_ID"} , "actioncommand":"TKN_VI_CONAMO_L_NO_RENT_RDA"};
   /* try {
        jsonpayload = getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }*/

    var targetgrid = getGridFromToolbarButton(e);
    var key = !e.id ? e.className : e.id;
    var jsonpayload = {};
    try {
        jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
    } catch (e) {
        kendoConsole.log("JsonPayload is not valid", true);
        return;
    }
    var detailRow = $(e).closest(".k-detail-row");
    var masterRow = detailRow.prev();                 

    
    var grid = masterRow.closest(".k-grid").data("kendoGrid");
    var dataItem = grid.dataItem(masterRow);

    jsonpayload.rowData = dataItem;
    //depending on the click binding (jquery click or html onclick)
    var selector = (e.currentTarget ? e.currentTarget : e);
    jsonpayload.jqgrid = $(selector).closest(".k-grid");
    jsonpayload.jrow = $(selector).closest(".k-grid tr");
    if (!jsonpayload.actiontype || !jsonpayload.actioncommand)
        console.log("actioncommand or actiontype not provided");
    dispatchAction(e, jsonpayload);
}