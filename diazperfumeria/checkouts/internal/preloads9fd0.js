
    (function() {
      var cdnOrigin = "https://cdn.shopify.com";
      var scripts = ["https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/polyfills-legacy.DQZTyjuy.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/app-legacy.J7j7Eubs.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/page-OnePage-legacy.DFDifdQm.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/DeliveryMethodSelectorSection-legacy.BfRtgVEs.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/useEditorShopPayNavigation-legacy.Bew1qcBE.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/VaultedPayment-legacy.DrzAIMKy.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/LocalizationExtensionField-legacy.CUxwLXWo.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/ShopPayOptInDisclaimer-legacy.zuypTNXM.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/ShipmentBreakdown-legacy.BrKjKIbT.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/MerchandiseModal-legacy.4qfAlQWl.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/StackedMerchandisePreview-legacy.1ZEjwHTh.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/PayButtonSection-legacy.CCO-5QID.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/component-ShopPayVerificationSwitch-legacy.aUiEONaA.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/useSubscribeMessenger-legacy.Bl8tPkOA.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.es/index-legacy.BABDJE92.js"];
      var styles = [];
      var fontPreconnectUrls = ["https://fonts.shopifycdn.com"];
      var fontPrefetchUrls = ["https://fonts.shopifycdn.com/scene/scene_n4.55ab2fde7bfb7da6efd98de5a1f08f259838599c.woff2?h1=YWxmYXNlbnQuY29tLmNv&hmac=5d6cb72fdf348192738117a13d7c08cc7cc94b1347d3d616e1955c5a12635ce7","https://fonts.shopifycdn.com/scene/scene_n7.a0f6688c550e59b6f66420f027bb7f459fa2eceb.woff2?h1=YWxmYXNlbnQuY29tLmNv&hmac=0d80ec04dd778209350a8bf61e11fc8ab1ca8b4a400e3436946efa4ecef42418"];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0575/1622/8680/files/logo-alfa-reco_x320.webp?v=1744382664"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [cdnOrigin].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  