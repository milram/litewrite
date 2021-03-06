define(function(require) {

  var $ = require('jquery');
  var Backbone = require('backbone');
  var AppView = require('views/app');
  var docs = require('collections/docs');
  var cache = require('utils/cache');
  var settings = require('models/settings');
  var router = require('utils/router');


  function litewrite() {

    var origHash = document.location.hash;

    remoteStorage.onWidget('ready', fetch);

    remoteStorage.onWidget('disconnect', function() {
      docs.reset().addNew();
    });

    remoteStorage.claimAccess('documents', 'rw').then(function() {
      remoteStorage.displayWidget('remotestorage-connect');
      setTimeout(function() {
        var md = origHash.match(/access_token=([^&]+)/);
        if(md && (! remoteStorage.getBearerToken())) {
          // backbone stole our access token
          remoteStorage.setBearerToken(md[1]);
        }
      }, 0);

    });

    settings
      .on('change:openDocId', setOpenDoc)
      .on('change:openDocId', setWindowTitle)
      .on('change:openDocId', router.setUrl, router)

    docs
      .on('change:title', router.setUrl, router)
      .on('change:title', setWindowTitle)
      .on('add', updateOpenDocId);


    fetch();

    $.when(settings.deferred, docs.deferred)
      .done(loadCache);

    cache.loading.done(setWindowTitle, startHistory);

    //Load on DOM-ready
    $(function() {
      new AppView();
    });

  }

  function loadCache() {
    ensureOpenDocId();
    setOpenDoc();
    cache.loading.resolve();
  }

  function ensureOpenDocId() {
    if ( _.isUndefined(settings.get('openDocId')) ) {
      settings.save('openDocId', docs.first().id);
    }
  }

  function setOpenDoc() {
    cache.openDoc = docs.get( settings.get('openDocId') );
  }

  function setWindowTitle() {
    document.title = (
      cache.openDoc ? cache.openDoc.get('title') : null
    ) || 'Litewrite';
  }

  function updateOpenDocId(doc) {
    settings.save('openDocId', doc.id);
  }

  function startHistory() {
    Backbone.history.start();
  }


  function fetch() {
    console.log('fetch triggered');
    docs.trigger('fetch');
    docs.fetch({
      success: function() {
        if (docs.isEmpty()) docs.addNew();
        docs.deferred.resolve();
      }
    });
  }


  return litewrite;
});
