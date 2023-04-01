const waitForElement = (selector) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

const checkForValidURL = (href) => {
  return href.includes("/c/") || href.includes("/channel/") || href.includes("/user/") || href.includes("youtube.com/@")
}

async function isChannelMonetized(channelUrl) {
  const cacheKey = `monetization-status:${channelUrl}`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const { isMonetized, cacheTimestamp } = JSON.parse(cachedData);
    return isMonetized;
  }

  var response = await fetch(channelUrl);
  var html = await response.text();
  const isMonetized = html.includes(`{"key":"is_monetization_enabled","value":"true"}`);

  const cacheData = {
    isMonetized,
    cacheTimestamp: Date.now(),
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));

  return isMonetized;
}

async function checkAllChannels() {
  const thumbnails = document.querySelectorAll('ytd-thumbnail');

  for (const thumbnail of thumbnails) {
    const element = thumbnail.parentElement
    const links = element.getElementsByTagName('a');
    for (const i of links) {
      if (i && i.getAttribute('href') && (i.href.includes("@") || i.href.includes("channel"))) {
        const channelUrl = 'https://www.youtube.com' + i.getAttribute('href');
        const isMonetized = await isChannelMonetized(channelUrl);
        const meta = element.querySelector('#meta');

        // проверяем, есть ли уже monetization в элементе
        let monetization = meta.querySelector('.monetization');
        if (!monetization) {
          monetization = document.createElement('div');
          monetization.classList.add('monetization');
          monetization.style.fontWeight = 'bold';
          monetization.innerText = isMonetized ? 'Monetized' : 'Not monetized';
          monetization.style.color = isMonetized ? 'green' : 'red';
          meta.appendChild(monetization);
        }
        break;
      }
    }
  }
}


// вызываем функцию сразу после загрузки страницы
window.onload = async function () {
    // добавляем monetization на новые элементы
  if (document.URL.includes("studio.youtube.com")) return;

  if (checkForValidURL(document.URL) === true) {
    const html = document.body.innerHTML
    const isMonetized = html.includes(`{"key":"is_monetization_enabled","value":"true"}`);
    monetization = document.createElement('div');
    monetization.classList.add('monetization');
    monetization.style.fontWeight = 'bold';
    monetization.innerText = isMonetized ? 'Monetized' : 'Not monetized';
    monetization.style.color = isMonetized ? 'green' : 'red';
    await waitForElement("#meta");
    document.querySelector('#meta').appendChild(monetization);
    return isMonetized;
  }
  
  else {
    const observer = new MutationObserver(async function(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const newElements = mutation.target.querySelectorAll('ytd-thumbnail');
          for (const thumbnail of newElements) {
            const element = thumbnail.parentElement
            const links = element.getElementsByTagName('a');
            for (const i of links) {
              if (i && i.getAttribute('href') && (i.getAttribute('href').includes("@") || i.getAttribute('href').includes("channel"))) {
                const channelUrl = 'https://www.youtube.com' + i.getAttribute('href');
                const isMonetized = await isChannelMonetized(channelUrl);
                const meta = element.querySelector('#meta');

                // проверяем, есть ли уже monetization в элементе
                let monetization = meta.querySelector('.monetization');
                if (!monetization) {
                  monetization = document.createElement('div');
                  monetization.classList.add('monetization');
                  monetization.style.fontWeight = 'bold';
                  monetization.innerText = isMonetized ? 'Monetized' : 'Not monetized';
                  monetization.style.color = isMonetized ? 'green' : 'red';
                  meta.appendChild(monetization);
                }
                break;
              }
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return await checkAllChannels();
  }
}