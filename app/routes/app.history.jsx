import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  useIndexResourceState,
  Text,
  Badge,
  Thumbnail
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const history = await prisma.tryOnAction.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 50 // limit to last 50 for performance right now
  });

  return json({ history });
};

export default function History() {
  const { history } = useLoaderData();
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(history);

  const rowMarkup = history.map(
    ({ id, productId, personImage, resultImage, status, createdAt }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <div style={{ padding: '0.25rem 0' }}>
            <Text fontWeight="bold" as="span">{new Date(createdAt).toLocaleString()}</Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {resultImage ? (
            <Thumbnail
              source={resultImage}
              alt="Generated Result"
              size="large"
            />
          ) : (
            <Text color="subdued" as="span">No image</Text>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
           <Text as="span" breakWord>Product ID: {productId.split('/').pop()}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={status === "COMPLETED" ? "success" : status === "FAILED" ? "critical" : "info"}>
            {status}
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page title="Virtual Try-On History" backAction={{content: 'Dashboard', url: '/app'}}>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Text as="p" color="subdued">No virtual try-on generations yet.</Text>
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'try-on generation', plural: 'try-on generations' }}
                itemCount={history.length}
                selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Date' },
                  { title: 'Result Image' },
                  { title: 'Product' },
                  { title: 'Status' },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
