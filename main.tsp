import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace WidgetService;

model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

model WidgetList {
  items: Widget[];
}

model Container {
  id: string;
  name: string;
  capacity: int32;
  widgets: Widget[];
}

model ContainerList {
  items: Container[];
}

@error
model Error {
  code: int32;
  message: string;
}

model AnalyzeResult {
  id: string;
  analysis: string;
}

model ContainerSummary {
  id: string;
  totalWidgets: int32;
  totalWeight: int32;
  utilizationPercentage: float32;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  /** List widgets */
  @get list(): WidgetList | Error;
  /** Read widgets */
  @get read(@path id: string): Widget | Error;
  /** Create a widget */
  @post create(@body body: Widget): Widget | Error;
  /** Update a widget */
  @patch update(@path id: string, @body body: MergePatchUpdate<Widget>): Widget | Error;
  /** Replace a widget */
  @put replace(@path id: string, @body body: Widget): Widget | Error;
  /** Delete a widget */
  @delete delete(@path id: string): void | Error;

  /** Analyze a widget */
  @route("{id}/analyze") @post analyze(@path id: string): AnalyzeResult | Error;
}

@route("/containers")
@tag("Containers")
interface Containers {
  /** List containers */
  @get list(): ContainerList | Error;
  /** Read container */
  @get read(@path id: string): Container | Error;
  /** Create a container */
  @post create(@body body: Container): Container | Error;
  /** Update a container */
  @patch update(@path id: string, @body body: MergePatchUpdate<Container>): Container | Error;
  /** Replace a container */
  @put replace(@path id: string, @body body: Container): Container | Error;
  /** Delete a container */
  @delete delete(@path id: string): void | Error;

  /** Add widget to container */
  @route("{id}/widgets") @post addWidget(@path id: string, @body widget: Widget): Container | Error;
  /** Remove widget from container */
  @route("{id}/widgets/{widgetId}") @delete removeWidget(@path id: string, @path widgetId: string): Container | Error;
  /** Get container summary */
  @route("{id}/summary") @get getSummary(@path id: string): ContainerSummary | Error;
}
