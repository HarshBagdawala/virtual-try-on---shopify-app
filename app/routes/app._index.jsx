import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Icon,
  Badge,
  CalloutCard,
  Grid
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  // Count stats
  const totalTryOns = await prisma.tryOnAction.count({
    where: { shop: session.shop }
  });

  const successfulTryOns = await prisma.tryOnAction.count({
    where: { shop: session.shop, status: "COMPLETED" }
  });

  // Get Store settings
  let settings = await prisma.storeSettings.findUnique({
    where: { shop: session.shop }
  });

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: { shop: session.shop }
    });
  }

  // Generate deep link to open Theme Editor and enable the App Block
  const shopData = await admin.graphql(`
    #graphql
    query {
      currentAppInstallation {
        id
      }
      themes(first: 1, roles: MAIN) {
        nodes {
          id
        }
      }
    }
  `).then(res => res.json());

  const themeId = shopData.data?.themes?.nodes[0]?.id?.split('/').pop();
  const themeEditUrl = `https://${session.shop}/admin/themes/${themeId}/editor?context=apps`;

  return json({
    shop: session.shop,
    stats: {
      totalTryOns,
      successfulTryOns,
      remainingCredits: settings.monthlyCredits
    },
    themeEditUrl
  });
};

export default function Index() {
  const { shop, stats, themeEditUrl } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page title="✨ Virtual Try-On Dashboard">
      <BlockStack gap="500">
        <Layout>
          
          <Layout.Section>
            <CalloutCard
              title="Activate Virtual Try-On in your Theme"
              illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10cb55805dd1aa62ae8ceec3b.svg"
              primaryAction={{
                content: 'Enable App Block',
                url: themeEditUrl,
                external: true,
              }}
            >
              <p>
                To display the "Virtual Try-On" button on your storefront product pages, 
                you must enable the app block in your Theme Editor.
              </p>
            </CalloutCard>
          </Layout.Section>

          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" color="subdued">
                      Total Try-Ons
                    </Text>
                    <Text as="p" variant="heading3xl">
                      {stats.totalTryOns}
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" color="subdued">
                      Successful Generations
                    </Text>
                    <Text as="p" variant="heading3xl">
                      {stats.successfulTryOns}
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" color="subdued">
                      Remaining Credits
                    </Text>
                    <Text as="p" variant="heading3xl">
                      {stats.remainingCredits}
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Quick Actions
                  </Text>
                  <BlockStack gap="200">
                    <Button onClick={() => navigate("/app/history")}>View Try-On History</Button>
                    <Button onClick={() => navigate("/app/settings")}>Customize Widget Settings</Button>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Need Help?
                  </Text>
                  <List>
                    <List.Item>Make sure you have added your Supabase URL in `.env`</List.Item>
                    <List.Item>Ensure you have added your Replicate API key in Settings</List.Item>
                    <List.Item>The Virtual Try-On widget automatically adapts to dark mode.</List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
