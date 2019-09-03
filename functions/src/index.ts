import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as urlBuilder from "build-url";
import * as reqPromise from "request-promise";
import * as cors from "cors";
import * as serviceAccount from "./credentials/nf71p-578b7c281a.json";
import {
  dialogflow,
  SimpleResponse,
  BasicCard,
  Button,
  Image
} from "actions-on-google";
const corsHandler = cors({ origin: true });

// admin.initializeApp(functions.config().firebase);
const params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url
};
admin.initializeApp({
  credential: admin.credential.cert(params)
});
const apiKey: string = "AIzaSyBmCml_TbDp51tKsCARFCPO73gD3tsR1Ao";
const appLink: string = "https://fluttersamples.page.link";

export const ping = functions.https.onRequest((_req, response) => {
  response.send("Hello from Flutter-Samples!");
});

const app: any = dialogflow({ debug: true });
app.intent("Get latest news", getNewsHandler);
async function getNewsHandler(conv: any) {
  const db = admin.firestore();
  const snapshot: any = await db.collection("news").get();
  let news: any[] = [];
  snapshot.forEach((doc: any) => {
    news = [...news, Object.assign({ id: doc.id }, doc.data())];
  });
  const latest: any = news.reverse()[0];
  const link: any = await getShortLink(latest);
  conv.close(
    new SimpleResponse({
      text: latest["name"],
      speech: latest["description"]
    })
  );
  conv.close(
    new BasicCard({
      title: "Watch the latest news",
      image: new Image({
        url: latest["picture"],
        alt: `${latest["name"]} image`
      }),
      buttons: new Button({
        title: "Watch",
        url: link
      })
    })
  );
}

async function getShortLink(announcement: any) {
  return new Promise(async (resolve, reject) => {
    try {
      const options: any = {
        method: "POST",
        uri: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${apiKey}`,
        body: {
          longDynamicLink: makeDynamicLongLink(
            announcement["id"],
            announcement["description"],
            announcement["picture"]
          )
        },
        json: true
      };
      resolve(
        await reqPromise(options).then(parsedBody => parsedBody.shortLink)
      );
    } catch (error) {
      reject(error);
    }
  });
}

function makeDynamicLongLink(id: string, description: string, image: string) {
  return urlBuilder(appLink, {
    queryParams: {
      link: "https://github.com/devdennysegura",
      apn: "com.fluttersamples.flutter_google_assistant",
      afl: "https://github.com/devdennysegura",
      st: "Flutter Samples - All you need to know about flutter samples",
      sd: description,
      si: image
    }
  });
}

export const signin = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const uuid = req.query.id;
    await admin
      .auth()
      .createCustomToken(uuid, {})
      .then(token => {
        res.status(200).json({ token });
      })
      .catch(e =>
        res.status(400).json({ error: "Usuario/Contraseña incorrectos" })
      );
  });
});

export const fulfillment = functions.https.onRequest(app);
