function prerenderdCei(grid) {
  switch (grid.gridcode) {
    case 'CEI_ASSET_IDECAT':
      var origedit = grid.edit;
      grid.edit = function(e) {
        //elimina il pulsante salva per gli immobili di culto
        origedit.call(this, e);

        if (e.model.AS_IDECAT_ID == 0) {
          var el = $('#POLLEV_ID_binder');
          idecatCreate(el, false);
        }
      };

      break;
    case 'BCE_RICHIE_INTEGRA':
    case 'BVE_VI_ASSET_DA_INV':
    case 'ASSET_CEI_BCE':
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) della grid alla chiusura della popup
        origedit.call(this, e);
        var fieldToAppend = $('#AS_ASSET_NOTE')
          .parent()
          .parent();
        var fieldToAppend2 = $('input[name="longitude"]').parents('.col-sm-6');

        var autorev;
        //da sistemare...
        // per non incorrere in problemi viene trattata come una etichetta di un campo ...
        if (e.model.id_liv == '4')
          autorev =
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" style="margin-top:20px" >' +
            '<div class="k-edit-label" style="width:100%;text-align:left">' +
            '<span style="vertical-align: bottom; text-align: right;margin-right:5px" >Provenienza dei dati:</span>' +
            '<span style="vertical-align: bottom; text-align: left" id="provDato"> ' +
            e.model.autorevolezza +
            '</span>' +
            '</div' +
            '</div>';
        else
          autorev =
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" >' +
            '<div class="k-edit-label">' +
            '<label>    </label>' +
            '<div class="k-edit-field"></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-sm-6" style="margin-top:20px" >' +
            '<div class="k-edit-label" style="width:100%;text-align:left">' +
            '<span style="vertical-align: bottom; text-align: right;margin-right:5px" >Provenienza dei dati:</span>' +
            '<img src="Views/3/Images/ceia.gif" height="10%" width="10%">' +
            '<span style="vertical-align: bottom; text-align: left" id="provDato"> ' +
            e.model.autorevolezza +
            '</span>' +
            '</div' +
            '</div>';

        fieldToAppend.after(autorev);
        fieldToAppend2.after(autorev);
        e.container
          .parent()
          .find('.k-window-titlebar.k-header')
          .find('a[role=button]')
          .bind('click', function(evt) {
            e.sender.refresh();
          });
      };

      // nb: funziona solo sul dashboard in cui sono state inserite le grid tramite angular directive
      if (window.location.href.indexOf('dashboard') > 0) {
        var originalDataBound = grid.dataBound;
        grid.dataBound = function(e) {
          if (originalDataBound) originalDataBound.call(this, e);
          //refresh indicators
          $('.tab-pane.row.active.initialized')
            .find('.k-icon.k-i-tick')[0]
            .click();

          // Grid data
          var gridData = $('div[gridname="' + e.sender.options.gridcode + '"]')
            .data('kendoGrid')
            .dataSource.data();

          for (var i = 0; i < gridData.length; i++) {
            var currentUid = gridData[i].uid;
            // var currentRow = grid.table.find("tr[data-uid='" + currentUid + "']");
            var currentRow = $("tr[data-uid='" + currentUid + "']");
            var schedaButton = $(currentRow).find('.k-grid-BCE_ASSET');
            //hide edit button if class="edifici di culto"
            if (gridData[i].AS_ASSET_TIPASS_ID != 1) {
              schedaButton.hide();
            }
          }

          //check SSO case
          var filterGrid = $(
            'div[gridname="' + e.sender.options.gridcode + '"]'
          ).data('kendoGrid').dataSource._filter.filters;

          if (
            filterGrid.filter(function(e) {
              return e.type === 'SSO';
            }).length > 0
          ) {
            switch (e.sender.options.gridcode) {
              case 'BVE_VI_ASSET_DA_INV':
                $("a:contains('Da inviare')").click();
                break;
              case 'BCE_RICHIE_INTEGRA':
                $("a:contains('Richiesta integrazione')").click();
                break;
              case 'ASSET_CEI_BCE':
                $("a:contains('Richiesta integrazione')").click();
                break;
            }
          }
        };
      }

      break;
    /*
        case 'BCE_VI_RICHIE_INTEGRA':
          (function() {
            var ore_ = grid.dataSource.requestEnd;
            grid.dataSource.requestEnd = function(p) {
              ore_.call(this, p);
              if (p.type == 'create')
                $("div[gridname='BCE_IN_VALID']")
                  .data('kendoGrid')
                  .dataSource.fetch(function() {
                    setBadgeStato('Richiesta integrazione');
                  });
            };
          })();
          break;
          */
    case 'DASH_TD_GARE_GEN':
    case 'DASH_TD_GARE_DET':
    case 'DASH_TD_GARE_DEF':
    case 'DASH_TD_GARE_PROCAFF':
    case 'DASH_TD_GARE_PROV':
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == 'update' || p.type == 'create' || p.type == 'read') {
          $('.tab-pane.row.active.initialized')
            .find('.k-icon.k-i-tick')[0]
            .click();
          //  var msgType = typeof (p.response) == 'object' ? p.response : JSON.parse(p.response);
          // var msgType = JSON.parse(p.response);
          // if (msgType.msgtype == "OK" || !msgType.Errors) {
          //     $(".tab-pane.row.active.initialized").find(".k-icon.k-i-tick")[0].click();

          // }
          // else
          //     kendoConsole.log(p.response["Errors"], "error");
        }
      };

      var origedit = grid.edit;
      grid.edit = function(e) {
        //rieseguo il contesto
        origedit.call(this, e);

        $("label[for='FLAG_DECISION_DATE']").css({ color: '#f44242' });
        $("label[for='FLAG_ENTRUST_DATE']").css({ color: '#f44242' });
        $("label[for='FLAG_PROV_AWARD_DATE']").css({ color: '#f44242' });
        $("label[for='FLAG_DEF_AWARD_DATE']").css({ color: '#f44242' });

        var mioTab = $('#tabstrippopup').data('kendoTabStrip');
        if (e.model.EV_STAGE_CODE.length) {
          var stage = e.model.EV_STAGE_CODE;
          var steps = JSON.parse(e.model.JSON_STEPS);

          if (steps.tk_awacri_flag_affidamento === '0')
            mioTab.disable(mioTab.tabGroup.children().eq(1));

          if (steps.tk_awacri_flag_agg_provv === '0')
            mioTab.disable(mioTab.tabGroup.children().eq(2));

          if (steps.tk_awacri_flag_def === '0')
            mioTab.disable(mioTab.tabGroup.children().eq(3));

          switch (stage) {
            case 'DET':
              mioTab.disable(mioTab.tabGroup.children().eq(1));
              mioTab.disable(mioTab.tabGroup.children().eq(2));
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
            case 'PROCAFF':
              mioTab.disable(mioTab.tabGroup.children().eq(2));
              mioTab.disable(mioTab.tabGroup.children().eq(3));
              break;
            case 'PROV':
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

    case 'RD_VI_VALSOT_CEI':
      var ore_ = grid.dataSource.requestEnd;
      grid.dataSource.requestEnd = function(p) {
        ore_.call(this, p);
        if (p.type == 'update') {
          var gridRef = $("div[gridname='ASSET_LIST_CEI_NEW']").length
            ? 'ASSET_LIST_CEI_NEW'
            : $("div[gridname='VI_PercModelli']").length
              ? 'VI_PercModelli'
              : 'FASCICOLO_DASH';

          $('div[gridname=' + gridRef + ']')
            .data('kendoGrid')
            .dataSource.fetch(function() {
              var msgType = JSON.parse(p.response);
              if (msgType.msgtype == 'OK') {
                $('.tab-pane.row.active.initialized')
                  .find('.k-icon.k-i-tick')[0]
                  .click();
                validaEle(p.sender._data[0]);
              } else kendoConsole.log(p.response['Errors'], 'error');
            });
        }
      };

      break;

    case 'ASSET_LIST_CEI':
    case 'ASSET_LIST_CEI_NEW':
    case 'ASSET_LIST_CEI_BY_TYPE':
    case 'ASSET_LIST_CEI_DASH':
      var origedit = grid.edit;
      grid.edit = function(e) {
        //esegue il refresh (html) della grid alla chiusura della popup
        origedit.call(this, e);
        e.container
          .parent()
          .find('.k-window-titlebar.k-header')
          .find('a[role=button]')
          .bind('click', function(evt) {
            e.sender.refresh();
          });
      };

      if (
        $('#treecontainer').length === 0 &&
        grid.columns[0].command != undefined
      ) {
        pushCustomGroupToolbarButton(
          grid,
          [
            downloadtemplates['downloadmaintenanceplan'],
            downloadtemplates['downloadmaintenancemanual'],
            '<a onclick="showAssetImagesGallery(this);" class="k-button k-button-icontext">\
                                 <span class="fa fa-picture-o" aria-hidden="true"></span>' +
              getObjectText('imggallery') +
              '</a>',
          ],
          'Reports'
        );
      }
      //$(grid.columns).each(function (i, v) { if (v.field == "AS_ASSET_ADDRESS") v.template = assetAddressTemplate });
      //la nasconde il tasto fascicolo
      var originalDataBound = grid.dataBound;
      grid.dataBound = function(e) {
        if (originalDataBound) originalDataBound.call(this, e);

        var myGridID = e.sender.element[0].id;

        // if (grid.code === 'ASSET_LIST_CEI_BY_TYPE')
        // 	myGridID='FunctionSubMenuGrid-1'
        // else
        // 	myGridID='grid'

        //se presente un raggruppamento nella grid...
        if ($('#' + myGridID).data('kendoGrid').dataSource._group.length)
          var gridData = $('#' + myGridID).data('kendoGrid').dataSource._data;
        else
          var gridData = $('#' + myGridID)
            .data('kendoGrid')
            .dataSource.view();

        for (var i = 0; i < gridData.length; i++) {
          var currentUid = gridData[i].uid;
          // var currentRow = grid.table.find("tr[data-uid='" + currentUid + "']");
          var currentRow = $("tr[data-uid='" + currentUid + "']");
          var FascicoloButton = $(currentRow).find('.k-grid-FascImmID');
          var bceScheda = $(currentRow).find('.k-grid-SCHEDA_BCE');
          if (gridData[i].AS_ASSET_BCE_STAGE_ID === 8) {
            bceScheda.hide();
          }
          if (!gridData[i].Fl_FascicoloAttivo) {
            FascicoloButton.hide();
          }
        }
      };

      //imposta il filter in funzione della funzione (asset chiusi/aperti)
      var FunctionGuidID = getCurrentFunctionGUIDFromMenu();
      var today = new Date();
      if (FunctionGuidID === 'fabbe33d-4e8a-4389-bea9-0db9a595b9eb') {
        //Se Elenco immobili - Chiusi
        if (grid.code === 'ASSET_LIST_CEI_NEW') {
          grid.dataSource.filter = {
            logic: 'and',
            filters: [
              {
                field: 'AS_ASSET_CODE_FATHER',
                operator: 'eq',
                value: null,
                type: 'customCEI',
              },
              {
                field: 'AS_ASSET_DATA_FINE',
                operator: 'lte',
                value: today,
                type: 'customCEI',
              },
            ],
          };
        } else if (grid.code === 'ASSET_LIST_CEI_BY_TYPE') {
          grid.dataSource.filter = {
            field: 'AS_ASSET_DATA_FINE',
            operator: 'lte',
            value: today,
            type: 'customCEI',
          };
        }
      } else {
        //Se Elenco immobili - Attivi
        if (grid.code === 'ASSET_LIST_CEI_NEW') {
          grid.dataSource.filter = {
            logic: 'and',
            filters: [
              {
                field: 'AS_ASSET_CODE_FATHER',
                operator: 'eq',
                value: null,
                type: 'CEI',
              },
              {
                logic: 'or',
                type: 'customCEI',
                filters: [
                  {
                    field: 'AS_ASSET_DATA_FINE',
                    operator: 'eq',
                    value: null,
                    type: 'customCEI',
                  },
                  {
                    field: 'AS_ASSET_DATA_FINE',
                    operator: 'gt',
                    value: today,
                    type: 'customCEI',
                  },
                ],
              },
            ],
          };
        } else if (grid.code === 'ASSET_LIST_CEI_BY_TYPE') {
          //grid.dataSource.filter = { "logic": "or", "type": "customCEI", "filters": [{ "field": "AS_ASSET_DATA_FINE", "operator": "eq", "value": null, "type": "customCEI" }, { "field": "AS_ASSET_DATA_FINE", "operator": "gt", "value": today, "type": "customCEI" }] };
          // grid.dataSource.filter = { "logic": "and", "filters": [{ "field": "1", "operator": "eq", "value": "1" }, { "logic": "or", "type": "customCEI", "filters": [{ "field": "AS_ASSET_DATA_FINE", "operator": "eq", "value": null, "type": "customCEI" }, { "field": "AS_ASSET_DATA_FINE", "operator": "gt", "value": today, "type": "customCEI" }] }] };
          grid.dataSource.filter = {
            logic: 'or',
            type: 'customCEI',
            filters: [
              {
                field: 'AS_ASSET_DATA_FINE',
                operator: 'eq',
                value: null,
                type: 'customCEI',
              },
              {
                field: 'AS_ASSET_DATA_FINE',
                operator: 'gt',
                value: today,
                type: 'customCEI',
              },
            ],
          };
        }
      }
      break;
  }
}


function addIdecat(e) {
  var validatable = $('#CEI_ASSET_IDECAT')
    .kendoValidator()
    .data('kendoValidator');
	
  var uid=$(e).closest('div[data-uid]').attr('data-uid');
  var myGrid=$('tr[data-uid='+uid+']').closest('.k-grid');

  if (
    validatable.validateInput($('input[name=AS_IDECAT_FOGLIO]')) &&
    validatable.validateInput($('input[name=AS_IDECAT_TIPCAT_ID]')) &&
    validatable.validateInput($('input[name=AS_IDECAT_NUMERO]')) &&
    validatable.validateInput($('input[name=AS_IDECAT_SUBALTERNO]')) &&
    validatable.validateInput($('input[name=POLLEV_ID]'))
  ) {
    //var tabStrip = $('#tabstrippopup').kendoTabStrip().data('kendoTabStrip');
    //  tabStrip.select();
    //tabStrip.enable(tabStrip.tabGroup.children().not('.k-state-active'));
    var e = {};
    e.container = $('.k-edit-form-container');

    e.model = myGrid.data().kendoGrid.editable.options.model;

    var gridcode = 'CEI_ASSET_IDECAT';
    var gridentity = 'core.AS_V_ASSET_idecat';
    $('#pulsCustom').hide();
    $('.k-edit-buttons').show();
    var constr=manageStageConstraints.call(this, e, gridcode, gridentity);
  }
  
constr.then(function(e){
	  console.log(myGrid.data().kendoGrid.editable.options.model);
	  var mod= myGrid.data().kendoGrid.editable.options.model;
	  if(mod.checkPresent==1)
	  alert("Attenzione, l'identificativo catastale risulta essere già censinto a sistema, al salvataggio del dato verrà quindi esclusivamente collegato all'immobile");
	  
  },myGrid)
 
setTimeout(function () {
          var kendowindow = $('.k-popup-edit-form.k-window-content.k-content')[1];
            var win = $(kendowindow).data('kendoWindow');
          win.center();
		//  var tabstrippopup = $("#tabstrippopup").kendoTabStrip().data("kendoTabStrip");
        //     tabstrippopup.enable(tabstrippopup.tabGroup.children().not('.k-state-active'), true);
        }, 1000);

  console.log(e);
}


function closesEnteGrid(e) {
    var $e = $(e),
        $container =  $e.closest(".search-grid-opened");
//$e.parents("div.k-edit-form-container"),
        $incellWindow = $e.closest(".searchgrid-window");
    if ($incellWindow.length) {
        $incellWindow.data("kendoWindow").destroy();
        return;
    }
    $container.parents(".k-window").find("#close-researchgrid").remove();
    $container.parents(".k-window").find(".hidden-actions-by-searchgrid").show().removeClass("hidden-actions-by-searchgrid");
    $('#specImm').remove();
	$('#pulsCustom').remove();
    var grid =  $('div[gridname="AS_VI_ASSET_GROUPS"]')//$(e).closest(".gridItemSelector.k-grid");
    grid.fadeOut();
    grid.empty();
	
    var numcol = $container.parent().attr("numcol");
    $container.removeClass('search-grid-opened');
    resetPopupwindowDimension(numcol, $container);
    var tabStrip = $container.find("[data-role=tabstrip]").data("kendoTabStrip");  //tabstrip corrente
    if (tabStrip)
        tabStrip.enable(tabStrip.tabGroup.children());
}

function enteOnChange(e, newid) {
  debugger;
  
  
  
  var model = $('.derivativeassetgrid').data().kendoGrid.editable.options.model;
  if (model.DEFAULT_GROUP_ID != null) {
    var $e = $(e);
    var $windowCloseButton = $e.closest('.k-window').find('.k-window-actions');
    var $titlebar = $windowCloseButton.parent();
    var model = $('.derivativeassetgrid').data().kendoGrid.editable.options
      .model;

    $windowCloseButton.hide().addClass('hidden-actions-by-searchgrid'); //nasconde campi
    $titlebar.append(
      $(
        '<div id="close-researchgrid" class="k-window-actions"><a href="javascript:void(0);" class="k-window-action k-link"><span style="background-position: -32px -16px" class="k-icon">Close</span></a></div>'
      ).click(function (e) {
        closesEnteGrid(
          $e.closest('.k-window').find('.k-grid .k-grid-toolbar')[0]
        );
      })
    );

    if (e !== undefined) {
      var tabStrip = $e.closest('.k-tabstrip').data('kendoTabStrip'); //tabstrip corrente
      tabStrip.select();
      tabStrip.disable(tabStrip.tabGroup.children().not('.k-state-active'));
    }

    $('#tabstrippopup-1').prepend(
      '<div id="specImm"><p style="font-size:200%;text-align: center;"><br><b>Verifica gli immobili già censiti per l&#39;Ente</b></p></div><div id="specEnte"></div>'
    );

    var $container = $e.closest('div.k-popup-edit-form');

    //da controllare!!
    $container.addClass('search-grid-opened');
    expandPopUpwindow($container);

    requireConfigAndMore(['MagicSDK'], function (MF) {
      MF.kendo
        .getGridObject({
          gridName: 'AS_VI_ASSET_GROUPS',
        })
        .then(function (gridobj) {
          var model = $('.derivativeassetgrid').data().kendoGrid.editable
            .options.model;
          var filter = {
            field: 'AS_ASSGRO_US_GROUPS_ID',
            operator: 'eq',
            value: model.DEFAULT_GROUP_ID,
          };
          filtersolver(filter, gridobj, e);
          //caricata la definizione
          MF.kendo.appendGridToDom({
            kendoGridObject: gridobj,
            selector: 'specEnte',
          });
        })
        .then(function (kgrid) {
          //qui la griglia è in pagina

          $('div[gridname="AS_VI_ASSET_GROUPS"]').css('display', 'block');
          var el = $('#tabstrippopup').parent();
          $(el).append(
            '<div id="pulsCustom" style="text-align:right;margin-top:10px;margin-right:10px">' +
              '<a class="k-button k-button-icontext k-primary" onclick="closeCust(this)"><span class="k-icon k-update"></span>Annulla</a><a class="k-button k-button-icontext k-primary" onclick="closeCust(this)"><span class="k-icon k-update"></span>Prosegui</a></div>'
          );

          //andrebbe fatto dopo il databound!
          setTimeout(function () {
            var kendowindow = $(
              '.k-popup-edit-form.k-window-content.k-content.search-grid-opened'
            );
            var win = $(kendowindow).data('kendoWindow');
            win.center();
          }, 1000);
        });
    });
  }
  if (newid == undefined) {
    setTimeout(function () {
      if (typeof e.closest === 'undefined') e = e.sender.element;

      e.container = [e.closest('.k-edit-form-container')];
      var kendoEditable = $(e.container[0]).parent().data('kendoEditable');

      onChangeFieldmanageStageConstraints(
        e,
        null,
        kendoEditable.options.target.element,
        kendoEditable.options.model
      );
    }, 100);
  }
}

function idecatCreate(e, newid) {
  var $e = $(e);

/*
setTimeout(function () {
            var tabstrippopup = $("#tabstrippopup").kendoTabStrip().data("kendoTabStrip");
             tabstrippopup.enable(tabstrippopup.tabGroup.children().not('.k-state-active'), false);
        }, 2000);
		
*/
  $('.k-edit-buttons').hide();
  var el = $('#tabstrippopup').parent();
  $(el).append(
    '<div id="pulsCustom" style="text-align:right;margin-top:10px;margin-right:10px">' +
      '<a class="k-button k-button-icontext k-primary" onclick="closeCust(this)"><span class="k-icon k-update"></span>Annulla</a><a class="k-button k-button-icontext k-primary" onclick="addIdecat(this)"><span class="k-icon k-update"></span>Prosegui</a></div>'
  );

  //da controllare!!
  // $container.addClass('search-grid-opened');
  // expandPopUpwindow($container);
  // $titlebar.append(
  // $(
  //   '<div id="close-researchgrid" class="k-window-actions"><a href="#" class="k-window-action k-link"><span style="background-position: -32px -16px" class="k-icon">Close</span></a></div>'
  // ).click(function (e) {
  //   closesEnteGrid(
  //     $e.closest('.k-window').find('.k-grid .k-grid-toolbar')[0]
  //   );
  // }))
}

function closeCust(e) {
  debugger;
  if (e.innerText == 'Prosegui') $('#close-researchgrid').trigger('click');
  else {
    $('#close-researchgrid').trigger('click');
    $('.k-window-action').trigger('click');
  }
}


var ceiImm = {
  MD5Conv: function (s) {
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
      var k = '',
        F = '',
        G,
        d;
      for (d = 0; d <= 3; d++) {
        G = (x >>> (d * 8)) & 255;
        F = '0' + G.toString(16);
        k = k + F.substr(F.length - 2, 2);
      }
      return k;
    }

    function J(k) {
      k = k.replace(/rn/g, 'n');
      var d = '';
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
  viewPratic: function (e, dataRow) {
    var deferred = $.Deferred();
    requireConfigAndMore(['MagicSDK'], function (MF) {
      MF.api
        .get({
          storedProcedureName: 'custom.USP_Get_SerialNumber',
        })
        .then(
          function (result) {
            deferred.resolve(result);
            console.log(result);
          },
          function (err) {
            deferred.reject();
            console.log(err);
          }
        );
    });

    $.when(deferred).then(function (MF) {
      if (MF.length > 0) {
        var codDiocesi = dataRow.PRAIMM_CodiceDiocesiInterno;
        var nrPratica = dataRow.PRAIMM_NR_INTERNO_PRATICA.replace(/\//g, '_');
        var userID = MF[0][0].serial_number;

        var pratic;
        if (dataRow.PRAIMM_FONTE == 'EDI')
          pratic =
            'http://172.20.2.140/EdcW3b/Gestionale/Pratica?numeropratica=' +
            nrPratica +
            '&coddiocesi=' +
            codDiocesi +
            '&gestionale=1&serIst=0&iswebce=true&utentegest=' +
            userID;
        else
          pratic =
            'http://172.20.2.140/EdcW3b/Gestionale/Pratica?numeropratica=' +
            nrPratica +
            '&coddiocesi=' +
            codDiocesi +
            '&gestionale=1&serIst=0&iswebce=true&utentegest=' +
            userID;

        console.log(pratic);
        window.open(pratic);
      } else kendoConsole.log("Errore nel recupero dell'utente", 'info');
    });
  },
  viewCard: function (e, dataRow) {
    if (e) {
      var username = window.Username;
      // var dataRow=this.dataItem($(e.currentTarget).closest("tr"));
      var codDiocesi = dataRow.CodiceDiocesi;
      var provenienza = 'SIDIOpen BI2';
      var idProfilo = 1;
      var mode = 'view';
      var codSistema = 'F47C4711F4AF4A48BDB9BDFE9D6DD669';
      var schedaID = dataRow.Codice_interno_edificio;
      var string =
        codSistema +
        '-' +
        codDiocesi +
        '-' +
        username +
        '-' +
        1 +
        '-sobiceiimmobili-' +
        schedaID +
        '-' +
        mode;
      var token = this.MD5Conv(string);

      var censChiese =
        'http://testbbcc.glauco.it/CEIImmobili/verifyLogin.jsp?idDiocesi=' +
        codDiocesi +
        '&username=' +
        username +
        '&provenienza=' +
        provenienza +
        '&idProfilo=' +
        idProfilo +
        '&id=' +
        schedaID +
        '&mode=' +
        mode +
        '&token=' +
        token;

      console.log(censChiese);

      window.open(censChiese);
    }
    //console.log( "viewCard" );
  },
};



function ssoCeiImm(e) {
  var dataRow = this.dataItem($(e.currentTarget).closest('tr'));
  ceiImm.viewCard(e, dataRow);
}

function ssoPratic(e) {
  var dataRow = this.dataItem($(e.currentTarget).closest('tr'));
  ceiImm.viewPratic(e, dataRow);
}

///To be used in order to add Custom Html + angular pages load click (inside bootstrap modals) redmine Feature #3282
function showItemCustomFormWrapBce(e) {
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
  var gridName = $(e.currentTarget).closest('.k-grid').attr('gridname');
  //defined in AdminAreaCustomizations.js
  showItemCustomFormBCE(rowData, gridName, storedProcedure, controllerName);
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
  var gridName = $(e.currentTarget).closest('.k-grid').attr('gridname');
  //defined in AdminAreaCustomizations.js
  showItemCustomFormFas(rowData, gridName, storedProcedure, controllerName);
}
