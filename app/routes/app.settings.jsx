import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  InlineStack,
  Text,
  Checkbox
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  let settings = await prisma.storeSettings.findUnique({
    where: { shop: session.shop }
  });

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: { shop: session.shop }
    });
  }

  return json({ settings });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const buttonColor = formData.get("buttonColor");
  const buttonText = formData.get("buttonText");
  const captureEmail = formData.get("captureEmail") === "true";
  const replicateApiToken = formData.get("replicateApiToken");

  const settings = await prisma.storeSettings.update({
    where: { shop: session.shop },
    data: {
      buttonColor,
      buttonText,
      captureEmail,
      replicateApiToken
    }
  });

  return json({ success: true, settings });
};

export default function Settings() {
  const { settings } = useLoaderData();
  const submit = useSubmit();
  const nav = useNavigation();

  const [buttonColor, setButtonColor] = useState(settings.buttonColor || "#000000");
  const [buttonText, setButtonText] = useState(settings.buttonText || "Virtual Try-On");
  const [captureEmail, setCaptureEmail] = useState(settings.captureEmail || false);
  const [replicateApiToken, setReplicateApiToken] = useState(settings.replicateApiToken || "");

  const handleSave = () => {
    submit({
      buttonColor,
      buttonText,
      captureEmail: captureEmail.toString(),
      replicateApiToken
    }, { method: "post" });
  };

  const isLoading = nav.state === "submitting";

  return (
    <Page title="Widget Settings" backAction={{content: 'Dashboard', url: '/app'}}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Storefront Widget Appearance
              </Text>
              
              <TextField
                label="Button Text"
                value={buttonText}
                onChange={setButtonText}
                autoComplete="off"
                helpText="The text displayed on the product page button."
              />

              <TextField
                label="Button Background Color (Hex)"
                value={buttonColor}
                onChange={setButtonColor}
                autoComplete="off"
                helpText="e.g., #000000 for black, #ffffff for white."
              />

              <Checkbox
                label="Require Email before Try-On"
                checked={captureEmail}
                onChange={setCaptureEmail}
                helpText="Ask customers for their email to grow your newsletter list."
              />

            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                AI Provider Configuration
              </Text>
              <Text as="p" color="subdued">
                If you want to use your own Replicate account instead of the app's default pool, enter your API token here.
              </Text>
              
              <TextField
                label="Replicate API Token"
                value={replicateApiToken}
                onChange={setReplicateApiToken}
                type="password"
                autoComplete="off"
                helpText="Starts with 'r8_'."
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="end">
            <Button variant="primary" onClick={handleSave} loading={isLoading}>
              Save Settings
            </Button>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
