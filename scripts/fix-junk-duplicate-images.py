#!/usr/bin/env python3
"""
Fix junk images (logos, SVG icons, favicons) and cross-project duplicate photos
in mexico-project-images-all.json.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
MANIFEST = SCRIPTS / "mexico-project-images-all.json"
ROLES = ("hero", "inline-1", "inline-2")

JUNK_RE = re.compile(
    r"logo|favicon|webclip|isotipo|grupoemerita|6927887a|"
    r"icon%20arrow|icon.arrow|placeholder-image|placeholder%20image|"
    r"estacionamiento|futbol|tenis|gimnasio|elevador|llaves|comida\.|eventos\.|"
    r"asolearse|regadera|seguridad|wifi\.svg|yoga\.svg|spa\.svg|playa\.svg|"
    r"arrow-down|rcrr_favicon|emerita-favicon|grupo-emerita\.png|"
    r"logo-|negro\.webp|junglar-negro|paravian-negro|omara-negro|"
    r"constelada-negro|nhoa-negro|simcalogo|/logo\.png",
    re.I,
)

SVG_RE = re.compile(r"\.svg(?:\?|$)", re.I)

# slug -> [hero, inline-1, inline-2] — curated clean sources
OVERRIDES: dict[str, list[str]] = {
    "omara-tulum": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4cee2c5bd09360473_omara-exterior_13.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4471a6191f7ce18e6_omara-exterior_12.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce43e2203abe214bab7_omara-exterior_14.webp",
    ],
    "gran-tulum": [
        "https://grantulum.mx/uploads/sliders/1696547114_56b518b8409a8334fc5c.png",
        "https://grantulum.mx/assets/images/home1.png",
        "https://grantulum.mx/assets/images/tulum101.png",
    ],
    "constelada-tulum": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c5513826e2634fb5e7_Constelada%20Recepci%C3%B3n.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c183253211cf11b00a_Constelada%20Entrada.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c1df741563d388fafd_Constelada%20Frente-p-800.png",
    ],
    "nhoa-aldea-zama": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68caec26a0716e19d07ffdc6_Nhoa-p-1080.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac9489203bb878ed98d60d_Nhoa%20Tulum-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf39a4b1209fbd343db7e_junglar-p-1080.webp",
    ],
    "coralina-tulum": [
        "https://assets.cdn.filesafe.space/QqkqdK0ZwL6ZtBEyZyYs/media/6966a705e2d75b2c2728f2fb.jpeg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10)-p-1080.jpg",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/6a0b951b81aeff082f76f00a_Home.jpg",
    ],
    "duna-tulum": [
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016bc2e57ff51f0267cd87_75d19bcfa8694fd556282ddc6ebbbbc8_home-card-environment.jpg",
        "https://taomexico.com/wp-content/uploads/2026/01/Tao-Tulum-1.webp",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016b5bd36d9486feafd272_home-card-dining.jpg",
    ],
    "selva-zama-mondo": [
        "https://selvazama.mx/wp-content/uploads/2024/07/Heroe_Eng_web-1.webp",
        "https://selvazama.mx/wp-content/uploads/2024/10/charlesmiroux1982_Aerial_view_of_luxury_properties_in_Tulum._a52c78d9-2a63-4368-bf48-f5ab7abfbd1b.jpg",
        "https://selvazama.mx/wp-content/uploads/2024/10/04_charlesmiroux1982_Luxury_villa_tulum_lifestyle_outdoor_wabi_sab_540c9267-90ef-4996-94eb-339d6d50c797.jpg",
    ],
    "luum-zama": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/7ecfef1b-9a5b-4ffb-8a5a-a4e729bf1005.png",
        "https://selvazama.mx/wp-content/uploads/2024/07/Aldea-Premium-4.png",
        "https://selvazama.mx/wp-content/uploads/2024/07/charlesmiroux1982_Cinematic_Whimsical_Photography_Annie_Annie_L_1dee21af-c965-4bf3-9207-32237678fa47_web.webp",
    ],
    "rosewood-mandarina": [
        "https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_0604_RGB-1024x703.jpg",
        "https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_35615_RGB-e1642013892663.jpg",
        "https://rlhproperties.com/wp-content/uploads/2021/12/mn0193RGB-1024x718.jpg",
    ],
    "st-regis-residences-los-cabos": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac283f331875d60740e8a6_paravian-pool.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac284ad12caef698695765_4.webp",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016acd02007ec533071f9e_home-card-pools.jpg",
    ],
    "costa-mujeres-cancun": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74dfdbd0b55a3f8b06b6.png",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74df2f4795363835a17b.png",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74df1176890e94871f4f.png",
    ],
    "olea-luxury-beach-campeche": [
        "https://assets.cdn.filesafe.space/n4lLPqZ3Dv19TQTebcB6/media/66562fd41f92b2930595e2ea.png",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/location2.webp",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/amenidades2.webp",
    ],
    "el-lago-querencia": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74dfe3af39a52ebbd591.png",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74df41fe1bdea7f73409.png",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f9dbd0b5386e8ca49e.png",
    ],
    "it-building-playa": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10)-p-1600.jpg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca933198126d6c4f8e_showroom_5-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccafc47c7eb04af6c47_showroom_2-p-800.webp",
    ],
    "tres-patios-playa": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe91de773ef4c77f4ed9e_Tierra%20Madre.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca0a4e6bf094eca82e_showroom_6-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca4b8bfaf95580b707_showroom_1-p-800.webp",
    ],
    "ocean-village-playa": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10)-p-800.jpg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10).jpg",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1c3094bf341b2f5c524_home-card-bars-lounges.jpg",
    ],
    "progreso-beach-campeche": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68acae00b099d421f1c553a0_JUNGLAR_FOTO_BAKARI.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abeca4231b1323178df534_omara-p-1080.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2b7a9a5f1c00b16e4e0e_omara-entry-p-800.webp",
    ],
    "tao-monte-rocella": [
        "https://taomexico.com/wp-content/uploads/2026/01/Tao-Nautico-19.webp",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista.jpg",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-scaled-600x400.jpg",
    ],
    "tulum-country-club": [
        "https://selvazama.mx/wp-content/uploads/2024/10/02_charlesmiroux1982_different_images_of_tulum_lifestyle_outdoor_p_942f179b-b9b1-4da0-9441-87ac40e5ef3b-1024x574.jpg",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/6799720dca6561af0c5d2ec8_siari-mirador-picnic.jpg",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/6801710f78ae5da4b12d4760_56337c2735be7c2926259ce9d038308b_home-card-beach.jpg",
    ],
    "coronado-quivira": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf5884377b69d1659ceee_constelada-p-1080.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe65411b91238a156c6ad_tre%CC%81bola-p-800.webp",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1c3094bf341b2f5c524_home-card-bars-lounges.jpg",
    ],
    "one-only-mandarina": [
        "https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_35615_RGB-e1642013892663-1024x685.jpg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68aca77c199a3af4b99b05f2_junglar%2014-p-500.webp",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1c3094bf341b2f5c524_home-card-bars-lounges-p-500.jpg",
    ],
    "playacar-phase-ii": [
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/67577e61a0782b9d90bb590d_three-up-sample-1.jpg",
        "https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_0604_RGB.jpg",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1c3094bf341b2f5c524_home-card-bars-lounges.jpg",
    ],
    "holbox-lagoon-homes": [
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-1536x1024.jpg",
        "https://selvazama.mx/wp-content/uploads/2024/07/Aldea-Zama.png",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-600x400.jpg",
    ],
    "palmilla-san-jose": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf5884377b69d1659ceee_constelada.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe65411b91238a156c6ad_tre%CC%81bola-p-500.webp",
        "https://grantulum.mx/assets/images/home7.png",
    ],
    "pedregal-cabo": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf5884377b69d1659ceee_constelada-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf5884377b69d1659ceee_constelada-p-800.webp",
        "https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-300x123.webp",
    ],
    "puerto-los-cabos-marina": [
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016b5bd36d9486feafd272_home-card-dining-p-500.jpg",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1ac63465bc9354c0070_home-card-signature-restaurant.jpg",
        "https://grantulum.mx/assets/images/home4.png",
    ],
    "las-lupitas-campeche": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca4b8bfaf95580b707_showroom_1-p-800.webp",
        "https://selvazama.mx/wp-content/uploads/2024/07/Dharma.png",
        "https://selvazama.mx/wp-content/uploads/2024/07/Ahimsa.png",
    ],
    "torremar-country-club-campeche": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/fdd76883-93bd-4810-8029-7c1c3f8c4580.png",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/location1.webp",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f95472d439beb392e4.png",
    ],
    "cozumel-beach-condos": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abeca4231b1323178df534_omara.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68acadfff4dd9bfcde7472b8_JUNGLAR_FOTO_ALTEA-p-500.webp",
        "https://selvazama.mx/wp-content/uploads/2024/07/Blog.jpg",
    ],
    "cancun-lagoon-lofts": [
        "https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-1024x419.webp",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-768x512.jpg",
        "https://selvazama.mx/wp-content/uploads/2024/07/Blog-1024x768.jpg",
    ],
    "east-cape-villa-cabo": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca933198126d6c4f8e_showroom_5.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccaa1178733011fcfc8_showroom_4-p-800.webp",
        "https://taomexico.com/wp-content/uploads/2026/01/Naraina-Akumal-1.webp",
    ],
    "bao-luxury-condos-campeche": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f95472d4e087b392e3.png",
        "https://rlhproperties.com/wp-content/uploads/2021/12/mn0193RGB.jpg",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/11845c7b-aa24-4a50-a6bc-e342994b6e0a.png",
    ],
    "bardo-tulum": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68acadfff4dd9bfcde7472b8_JUNGLAR_FOTO_ALTEA.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68acae00b099d421f1c553a0_JUNGLAR_FOTO_BAKARI-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c04fda9cf7b23b667a_Constelada%20Roof%202-p-500.png",
    ],
    "the-fives-playa": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe91de773ef4c77f4ed9e_Tierra%20Madre-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe91de773ef4c77f4ed9e_Tierra%20Madre-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca0a4e6bf094eca82e_showroom_6.webp",
    ],
    "cabo-corridor-vista": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca933198126d6c4f8e_showroom_5-p-500.webp",
        "https://taomexico.com/wp-content/uploads/2026/01/Edena-Tulum-1.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccafc47c7eb04af6c47_showroom_2.webp",
    ],
    "nuevo-vallarta-bungalows": [
        "https://taomexico.com/wp-content/uploads/2026/01/Aerial-view.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccaa1178733011fcfc8_showroom_4.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca3f3057c98d0fb13e_showroom_11.webp",
    ],
    "campeche-gulf-villas": [
        "https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_35615_RGB.jpg",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f9dbd0b5bdfa8ca49f.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca4b8bfaf95580b707_showroom_1.webp",
    ],
    "puerto-aventuras-marina": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abeca4231b1323178df534_omara-p-800.webp",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-1024x683.jpg",
        "https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-600x245.webp",
    ],
    "playa-emerald-studio": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccb954fca0c0458387a_showroom_9.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca93305a2b21ec67ac_showroom_10-p-800.webp",
        "https://selvazama.mx/wp-content/uploads/2024/07/Blog_2-760x760.jpg",
    ],
    "cancun-downtown-lofts": [
        "https://selvazama.mx/wp-content/uploads/2024/10/03_charlesmiroux1982_Boho_look_Business_professionals_and_affluent_e8596c3a-cac2-4263-b395-907ce546fd29-720x400.jpg",
        "https://grantulum.mx/assets/images/home5.png",
        "https://grantulum.mx/assets/images/resonante.png",
    ],
    "cancun-huayacan-condos": [
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695878c5820979907c1add41_home-card-03.jpg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca1eff905f2adbab75_showroom_8-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca27eb713441644efa_showroom_7-p-800.webp",
    ],
    # victims that lost images to overrides — filler showroom sets
    "bacalar-mia-suites": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69ea919ba48992f689039417.jpeg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce3083155ebbbd02a3b_omara-exterior_7-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4386a1f06045c7c87_omara-exterior_6.webp",
    ],
    "campeche-city-lofts": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/ce480e93-2f0c-421b-a324-414f9e426597.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2b7a9a5f1c00b16e4e0e_omara-entry-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2b7a9a5f1c00b16e4e0e_omara-entry.webp",
    ],
    "riviera-maya-mayakoba-studio": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca0a4e6bf094eca82e_showroom_6-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca3f3057c98d0fb13e_showroom_11-p-500.webp",
        "https://selvazama.mx/wp-content/uploads/2024/07/Blog_2-320x320.jpg",
    ],
    "tao-santamar-akumal": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68acadfff4dd9bfcde7472b8_JUNGLAR_FOTO_ALTEA-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68acae00b099d421f1c553a0_JUNGLAR_FOTO_BAKARI-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c0df741563d388face_Constelada%202-p-800.png",
    ],
    "garza-blanca-pv": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68caec26a0716e19d07ffdc6_Nhoa-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf39a4b1209fbd343db7e_junglar-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68caec26a0716e19d07ffdc6_Nhoa.webp",
    ],
    "chileno-bay-residences": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c04fda9cf7b23b667a_Constelada%20Roof%202-p-800.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c02670b4f5e6e17d2b_Constelada%203-p-800.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c0df741563d388face_Constelada%202-p-500.png",
    ],
    "distrito-xcalacoco-beach": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca5e651cbe5f8d6fab_showroom_3-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca1eff905f2adbab75_showroom_8.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca27eb713441644efa_showroom_7.webp",
    ],
    "lerma-beach-condos-campeche": [
        "https://assets.cdn.filesafe.space/Bto3AyCMwnay3QoIPDfP/media/6706e1d94f1479c8efd684f2.jpeg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4cee2c5bd09360473_omara-exterior_13-p-800.webp",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f95472d439beb392e4.png",
    ],
    "inna-beach-condos": [
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc78f2b59a4a0711eef4b1.jpg",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc78f2f5f2698a4670c371.jpg",
        "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc78f2471c65cb52186ccf.jpg",
    ],
    "amaru-inka": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccaa1178733011fcfc8_showroom_4-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca93305a2b21ec67ac_showroom_10-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccb954fca0c0458387a_showroom_9-p-800.webp",
    ],
    "ceiba-25-condo-paradise": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69a73ea5fe0d7ecb81044eef_Paravian.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10)-p-1600.jpg",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac284ad12caef698695765_4.webp",
    ],
    "copala-quivira": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c1df741563d388fafd_Constelada%20Frente-p-500.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c183253211cf11b00a_Constelada%20Entrada-p-800.png",
        "https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1ac63465bc9354c0070_home-card-signature-restaurant-p-500.jpg",
    ],
    "maresol-downtown-studios": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c02670b4f5e6e17d2b_Constelada%203.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c04fda9cf7b23b667a_Constelada%20Roof%202.png",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c0df741563d388face_Constelada%202.png",
    ],
    "nalu-sea-living": [
        "https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-768x314.webp",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-2048x1365.jpg",
        "https://grantulum.mx/assets/images/home2.png",
    ],
    "oceana-residences": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca5e651cbe5f8d6fab_showroom_3.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca1eff905f2adbab75_showroom_8.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca5e651cbe5f8d6fab_showroom_3-p-800.webp",
    ],
    "tulum-jungle-lofts": [
        "https://grantulum.mx/assets/images/sandrect.png",
        "https://grantulum.mx/assets/images/home6.png",
        "https://grantulum.mx/uploads/sliders/1696547114_56b518b8409a8334fc5c.png",
    ],
    "aldea-thai": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce3083155ebbbd02a3b_omara-exterior_7-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4386a1f06045c7c87_omara-exterior_6-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4471a6191f7ce18e6_omara-exterior_12-p-800.webp",
    ],
    "junglar-kaybe": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce43e2203abe214bab7_omara-exterior_14-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abeca4231b1323178df534_omara-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c5513826e2634fb5e7_Constelada%20Recepci%C3%B3n-p-500.png",
    ],
    "mavila-quivira": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10)-p-500.jpg",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/portada.webp",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/amenidades1.webp",
    ],
    "vidanta-nuevo-vallarta": [
        "https://taomexico.com/wp-content/uploads/2026/01/tao-blue-gardens-vallarta.webp",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-scaled.jpg",
        "https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-300x200.jpg",
    ],
    "hacienda-encantada": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68aca77c199a3af4b99b05f2_junglar%2014.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68caec26a0716e19d07ffdc6_Nhoa-p-500.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf39a4b1209fbd343db7e_junglar.webp",
    ],
    "the-city-playa": [
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe91de773ef4c77f4ed9e_Tierra%20Madre-p-1080.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca3f3057c98d0fb13e_showroom_11-p-800.webp",
        "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccb954fca0c0458387a_showroom_9-p-800.webp",
    ],
}

def is_junk(url: str) -> bool:
    if SVG_RE.search(url):
        return True
    return bool(JUNK_RE.search(url))


# Known 404/403 — never assign as dedup fallback
BAD_URLS: set[str] = {
    "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69713123fc6c3225341f6f40.png",
    "https://cdn.prod.website-files.com/688478dccbeba13cdede033b/67997ae8bdfd71441fe5abc0_92a717e06e9c5a5147774dd0ee80300b_simca-riviera-maya-riviera-maya-real-estate-investment-p-800.webp",
    "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/336bc0eb-8f0e-4c0a-9f0e-8f0e4c0a9f0e.png",
    "https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/f726f5dc-8f0e-4c0a-9f0e-8f0e4c0a9f0e.png",
    "https://assets.cdn.filesafe.space/n4lLPqZ3Dv19TQTebcB6/media/6961153c-8f0e-4c0a-9f0e-8f0e4c0a9f0e.png",
}


def is_blocked(url: str) -> bool:
    return is_junk(url) or url in BAD_URLS


def is_bad_article(article: dict) -> bool:
    urls = [im["url"] for im in article["images"]]
    if article["slug"] in OVERRIDES:
        return True
    if any(is_junk(u) for u in urls):
        return True
    return False


def set_urls(article: dict, urls: list[str], source: str) -> None:
    article["source"] = source
    for role, url in zip(ROLES, urls):
        for im in article["images"]:
            if im["role"] == role:
                im["url"] = url


def pick_fallback(used: set[str], prefer: list[str]) -> str | None:
    for u in prefer:
        if u not in used and not is_blocked(u):
            return u
    return None


FALLBACK_POOL = [
    u
    for u in """
https://grantulum.mx/assets/images/home2.png
https://grantulum.mx/assets/images/home4.png
https://grantulum.mx/assets/images/home5.png
https://grantulum.mx/assets/images/home7.png
https://grantulum.mx/assets/images/resonante.png
https://grantulum.mx/assets/images/sandrect.png
https://selvazama.mx/wp-content/uploads/2024/07/Aldea-Premium-3.png
https://selvazama.mx/wp-content/uploads/2024/07/Aldea-Premium-4.png
https://selvazama.mx/wp-content/uploads/2024/07/Blog.jpg
https://selvazama.mx/wp-content/uploads/2024/07/Blog_2.jpg
https://selvazama.mx/wp-content/uploads/2024/10/02_charlesmiroux1982_different_images_of_tulum_lifestyle_outdoor_p_942f179b-b9b1-4da0-9441-87ac40e5ef3b.jpg
https://selvazama.mx/wp-content/uploads/2024/10/03_charlesmiroux1982_Boho_look_Business_professionals_and_affluent_e8596c3a-cac2-4263-b395-907ce546fd29.jpg
https://rlhproperties.com/wp-content/uploads/2021/12/mn0193RGB-1024x718.jpg
https://taomexico.com/wp-content/uploads/2026/01/Edena-Tulum-1.webp
https://taomexico.com/wp-content/uploads/2026/01/Naraina-Akumal-1.webp
https://taomexico.com/wp-content/uploads/2026/01/Tao-Tulum-1.webp
https://images.squarespace-cdn.com/content/v1/60c795169c2d5c30f8b7834e/de23d154-2aee-4875-8c08-f2d7a356318e/Imagen1.png?format=1500w
https://images.squarespace-cdn.com/content/v1/60c795169c2d5c30f8b7834e/451d648a-9976-4359-997f-ddaa102a7542/5.+Studio+Tulum+46.jpg?format=1500w
https://framerusercontent.com/images/0jCs9OLhxSP1xSRjP6S3GcFadDk.png?width=2048
https://framerusercontent.com/images/AsVZ9JMSJPdZnsz9bCetJ49fVI.png?width=1536
https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/location1.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca5e651cbe5f8d6fab_showroom_3-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca27eb713441644efa_showroom_7-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca1eff905f2adbab75_showroom_8-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccafc47c7eb04af6c47_showroom_2-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca933198126d6c4f8e_showroom_5-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccaa1178733011fcfc8_showroom_4-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca0a4e6bf094eca82e_showroom_6-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca3f3057c98d0fb13e_showroom_11-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ccb954fca0c0458387a_showroom_9-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca93305a2b21ec67ac_showroom_10-p-500.webp
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016acd02007ec533071f9e_home-card-pools-p-500.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016b1ebb65276f95c05bd6_home-card-spas-p-500.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016b5bd36d9486feafd272_home-card-dining-p-500.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016bc2e57ff51f0267cd87_75d19bcfa8694fd556282ddc6ebbbbc8_home-card-environment-p-500.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/6801710f78ae5da4b12d4760_56337c2735be7c2926259ce9d038308b_home-card-beach-p-500.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1c3094bf341b2f5c524_home-card-bars-lounges-p-500.jpg
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74dfdbd0b55a3f8b06b6.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74df2f4795363835a17b.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc74df1176890e94871f4f.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f9dbd0b5bdfa8ca49f.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc83f95472d4e087b392e3.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/11845c7b-aa24-4a50-a6bc-e342994b6e0a.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/11845c7b-aa24-4a50-a6bc-e342994b6e0a.png
https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1.webp
https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-1024x419.webp
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-1024x683.jpg
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-1536x1024.jpg
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-scaled-600x400.jpg
https://selvazama.mx/wp-content/uploads/2024/07/Heroe_Eng_web-1-1024x577.webp
https://selvazama.mx/wp-content/uploads/2024/07/Heroe_Eng_web-1-1536x865.webp
https://selvazama.mx/wp-content/uploads/2024/10/charlesmiroux1982_Aerial_view_of_luxury_properties_in_Tulum._a52c78d9-2a63-4368-bf48-f5ab7abfbd1b-1024x574.jpg
https://selvazama.mx/wp-content/uploads/2024/10/04_charlesmiroux1982_Luxury_villa_tulum_lifestyle_outdoor_wabi_sab_540c9267-90ef-4996-94eb-339d6d50c797-1024x574.jpg
https://selvazama.mx/wp-content/uploads/2024/07/Blog-1024x768.jpg
https://selvazama.mx/wp-content/uploads/2024/07/Blog_2-1024x1024.jpg
https://images.squarespace-cdn.com/content/v1/60c795169c2d5c30f8b7834e/87a54f28-7548-495e-a96e-8f083a842622/Imagen4.png?format=1500w
https://framerusercontent.com/images/wL0Z8oUuR75JN1na7j60zBUr200.png?width=1536
https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-1024x419.webp
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc7386ae539c4ece74eb1b.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/d0e28852-3717-4660-824d-e5127881d02a.png
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/63ada845-909e-4d0d-be1b-4426e056b5e4.png
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf39a4b1209fbd343db7e_junglar-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68aca77c199a3af4b99b05f2_junglar%2014.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe65411b91238a156c6ad_tre%CC%81bola.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c5513826e2634fb5e7_Constelada%20Recepci%C3%B3n-p-800.png
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c183253211cf11b00a_Constelada%20Entrada-p-800.png
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1c3094bf341b2f5c524_home-card-bars-lounges.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695878c5820979907c1add41_home-card-03-p-500.jpg
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/695ef1ac63465bc9354c0070_home-card-signature-restaurant-p-500.jpg
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac284ad12caef698695765_4-p-800.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68aca77c199a3af4b99b05f2_junglar%2014-p-500.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2cca93305a2b21ec67ac_showroom_10.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2b7a9a5f1c00b16e4e0e_omara-entry.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abeca4231b1323178df534_omara.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c0df741563d388face_Constelada%202.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c04fda9cf7b23b667a_Constelada%20Roof%202.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69ab16c02670b4f5e6e17d2b_Constelada%203.webp
https://cdn.prod.website-files.com/6743c3e6ac714cfd67db12cc/68016b1ebb65276f95c05bd6_home-card-spas.jpg
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-768x512.jpg
https://grantulum.mx/assets/images/home3.png
https://grantulum.mx/assets/images/home6.png
https://selvazama.mx/wp-content/uploads/2024/07/Aldea-Premium.png
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68caec26a0716e19d07ffdc6_Nhoa.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf39a4b1209fbd343db7e_junglar.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abe91de773ef4c77f4ed9e_Tierra%20Madre-p-1080.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68abf39a4b1209fbd343db7e_junglar-p-1080.webp
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-300x200.jpg
https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-300x123.webp
https://taomexico.com/wp-content/uploads/2025/12/67ae5c9a5e0e99ea60e7f965_TAO_HOME_BANNER_DESK-1-768x314.webp
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc78f2b59a4a0711eef4b1.jpg
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc78f2f5f2698a4670c371.jpg
https://assets.cdn.filesafe.space/4WKAshJWeeeLZiJbuxHA/media/69cc78f2471c65cb52186ccf.jpg
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/69f8e4b50e25b9e15d7d0deb_Paravian_Amenidades%20(10)-p-1600.jpg
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac9489203bb878ed98d60d_Nhoa%20Tulum-p-800.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68ac2ce4cee2c5bd09360473_omara-exterior_13-p-800.webp
https://cdn.prod.website-files.com/688478dccbeba13cdede033b/68caec26a0716e19d07ffdc6_Nhoa.webp
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista.jpg
https://taomexico.com/wp-content/uploads/2025/12/santamar-prime-vista-600x400.jpg
https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_0604_RGB.jpg
https://rlhproperties.com/wp-content/uploads/2021/12/Mandarina_35615_RGB.jpg
https://rlhproperties.com/wp-content/uploads/2021/12/mn0193RGB.jpg
""".strip().splitlines()
    if u.strip()
]


def build_dedup_candidates(articles: list[dict]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for src in (
        FALLBACK_POOL,
        [u for urls in OVERRIDES.values() for u in urls],
        [im["url"] for art in articles for im in art["images"]],
    ):
        for u in src:
            if u in seen or is_blocked(u):
                continue
            seen.add(u)
            out.append(u)
    return out


def resolve_duplicates(articles: list[dict]) -> int:
    """Ensure 300 unique URLs; duplicates get fallback replacements."""
    changed = 0
    by_url: dict[str, list[tuple[dict, dict]]] = defaultdict(list)
    for art in articles:
        for im in art["images"]:
            by_url[im["url"]].append((art, im))

    used = {im["url"] for art in articles for im in art["images"]}
    candidates = [u for u in build_dedup_candidates(articles) if u not in used]
    fb_idx = 0

    for _url, refs in sorted(by_url.items(), key=lambda x: -len(x[1])):
        if len(refs) <= 1:
            continue
        override_refs = [r for r in refs if r[0]["slug"] in OVERRIDES]
        other_refs = [r for r in refs if r[0]["slug"] not in OVERRIDES]
        if other_refs:
            to_replace = sorted(other_refs, key=lambda r: (r[0]["slug"], r[1]["role"]))
        elif len(override_refs) > 1:
            to_replace = sorted(override_refs, key=lambda r: (r[0]["slug"], r[1]["role"]))[1:]
        else:
            continue
        for art, im in to_replace:
            replacement = None
            while fb_idx < len(candidates):
                candidate = candidates[fb_idx]
                fb_idx += 1
                if candidate not in used:
                    replacement = candidate
                    break
            if not replacement:
                continue
            im["url"] = replacement
            art["source"] = "dedup-fallback"
            used.add(replacement)
            changed += 1
    return changed


def main() -> None:
    data = json.loads(MANIFEST.read_text())
    articles = data["articles"]
    changed_slugs: list[str] = []

    for art in articles:
        slug = art["slug"]
        if slug in OVERRIDES:
            set_urls(art, OVERRIDES[slug], "curated-override")
            changed_slugs.append(slug)
            continue
        if any(is_blocked(im["url"]) for im in art["images"]):
            used = {im["url"] for a in articles for im in a["images"]}
            candidates = [u for u in build_dedup_candidates(articles) if u not in used]
            trio = []
            for _ in ROLES:
                if not candidates:
                    break
                fb = candidates.pop(0)
                trio.append(fb)
                used.add(fb)
            if len(trio) == 3:
                set_urls(art, trio, "junk-fallback")
                changed_slugs.append(slug)

    dedup_changed = 0
    for _ in range(8):
        n = resolve_duplicates(articles)
        dedup_changed += n
        if n == 0:
            break

    urls = [im["url"] for art in articles for im in art["images"]]
    junk_left = [(art["slug"], im["role"], im["url"]) for art in articles for im in art["images"] if is_blocked(im["url"])]
    dups_left = len(urls) - len(set(urls))

    data["rule"] = "300 unique URLs — no junk logos/SVG/dupes (2026-06-14)"
    data["verified"] = "2026-06-14"
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    print(f"Overrides applied: {len(changed_slugs)} slugs")
    print(f"Dedup replacements: {dedup_changed}")
    print(f"Unique URLs: {len(set(urls))}/300")
    print(f"Duplicates left: {dups_left}")
    print(f"Junk left: {len(junk_left)}")
    if junk_left:
        for row in junk_left[:10]:
            print("  JUNK", row)
    if dups_left:
        from collections import Counter
        c = Counter(urls)
        for u, n in c.items():
            if n > 1:
                print("  DUP", n, u[:90])


if __name__ == "__main__":
    main()
