import * as React from "react";
import { ToolFormProps } from "../interfaces";
import { t } from "i18next";
import {
  Row,
  Col,
  Widget,
  WidgetBody,
  WidgetHeader,
  BlurableInput,
  SaveBtn
} from "../../ui";
import { TaggedTool, getArrayStatus } from "../../resources/tagged_resources";
import { edit, destroy, init, saveAll } from "../../api/crud";
import { ToolTips } from "../../constants";

export class ToolForm extends React.Component<ToolFormProps, {}> {
  emptyTool = (): TaggedTool => {
    return {
      uuid: "ERROR: GENERATED BY REDUCER - UUID SHOULD BE UNSEEN",
      specialStatus: undefined,
      kind: "tools",
      body: { name: "Tool " + (this.props.tools.length + 1) }
    };
  }

  render() {
    const toggle = () => this.props.toggle();
    const { dispatch, tools } = this.props;
    const specialStatus = getArrayStatus(tools);
    return <Widget>
      <WidgetHeader helpText={ToolTips.TOOL_LIST} title="Tools">
        <button
          className="fb-button gray"
          onClick={() => { toggle(); }}
          hidden={!!specialStatus}>
          {t("Back")}
        </button>
        <SaveBtn
          status={specialStatus}
          onClick={() => {
            dispatch(saveAll(tools, () => { toggle(); }));
          }} />
        <button
          className="fb-button green"
          onClick={() => { dispatch(init(this.emptyTool())); }}>
          <i className="fa fa-plus" />
        </button>
      </WidgetHeader>
      <WidgetBody>
        <Row>
          <Col xs={12}>
            <label>{t("Tool Name")}</label>
          </Col>
        </Row>
        {tools.map((tool: TaggedTool, index: number) => {
          return <Row key={index}>
            <Col xs={10}>
              <BlurableInput
                id={(tool.body.id || "Error getting ID").toString()}
                value={tool.body.name || "Error getting Name"}
                onCommit={(e) => {
                  dispatch(edit(tool, { name: e.currentTarget.value }));
                }} />
            </Col>
            <Col xs={2}>
              <button
                className="fb-button red"
                onClick={() => { dispatch(destroy(tool.uuid)); }}>
                <i className="fa fa-times"></i>
              </button>
            </Col>
          </Row>;
        })}
      </WidgetBody>
    </Widget>;
  }
}