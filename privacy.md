# Privacyverklaring SuperMagister-extensie

_Laatst bijgewerkt: 8 oktober 2026_

De SuperMagister-extensie koppelt de SuperMagister-app aan je eigen Magister-account, zodat je je
rooster, huiswerk en cijfers in SuperMagister ziet. SuperMagister is onofficieel en niet verbonden
aan Magister of Iddink. De extensie is alleen bedoeld voor je eigen account.

## Kort gezegd

- De extensie vraagt en ziet **nooit je wachtwoord**. Je logt in bij Magister zelf.
- Je gegevens gaan **nooit naar een server van SuperMagister**. De extensie praat alleen met
  Magister (je eigen school) en met de SuperMagister-app in je eigen browser.
- We verzamelen geen statistieken, tonen geen advertenties en verkopen of delen niets met anderen.

## Welke gegevens en waarom

| Gegeven                                                    | Waarom                                                       | Waar en hoe lang                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Je Magister-sessie (access token en verloopmoment)         | Om namens jou je eigen gegevens bij Magister op te halen     | Alleen in het geheugen van de browser; weg als die sluit |
| Het adres van je school (`jouwschool.magister.net`)        | Om de sessie te vernieuwen en Magister te openen             | Lokaal in de browser, tot je ontkoppelt                  |
| Je Magister-persoonsnummer                                 | Om je nieuwste cijfers te tellen voor het getal op het icoon | Alleen in het geheugen van de browser                    |
| Aantal nieuwe cijfers en het moment van je nieuwste cijfer | Voor het getal op het icoon en de melding                    | Lokaal in de browser, tot je ontkoppelt                  |
| Je keuze voor meldingen en het adres van de app            | Om de popup en meldingen te laten werken                     | Lokaal in de browser                                     |

De inhoud van je cijfers, rooster en huiswerk wordt door de extensie niet bewaard. Die gaan direct
van Magister naar de SuperMagister-app in je browser. De app bewaart ze daar op je eigen apparaat,
zodat je ze ook ziet als je koppeling even verlopen is.

## Met wie de extensie praat

- **Magister** (`https://jouwschool.magister.net`): om je eigen gegevens op te halen, met je eigen
  sessie. Alleen lezen; de extensie verandert niets in Magister.
- **De SuperMagister-app** in je eigen browser: de extensie geeft de app alleen door of je gekoppeld
  bent en tot wanneer. Het token zelf blijft in de extensie.

Er gaat niets naar andere websites, analysediensten of derden.

## Rechten die de extensie vraagt

| Recht                       | Waarom                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `storage`                   | Je sessie (alleen in het geheugen) en je instellingen bewaren                                       |
| `notifications`             | Melden dat je opnieuw moet inloggen bij Magister, en (als je dat aanzet) dat er een pack klaarstaat |
| `alarms`                    | Elk kwartier je sessie vers houden en nieuwe cijfers tellen                                         |
| `https://*.magister.net/*`  | Je sessie lezen op je eigen Magister en je gegevens ophalen bij Magister                            |
| Het adres van SuperMagister | Met de SuperMagister-app praten in je eigen browser                                                 |

## Zelf alles wissen

- Klik in de popup van de extensie (of in de app bij Instellingen → Gegevens) op **Ontkoppelen**.
  Je sessie en alle gegevens van je account gaan dan weg, in de extensie en in de app.
- Verwijder je de extensie, dan wist de browser alles wat de extensie bewaarde.

## Vragen

Vragen over deze verklaring? Neem contact op met de beheerder van SuperMagister: [vul hier een
contactadres in voordat je de extensie publiceert].
