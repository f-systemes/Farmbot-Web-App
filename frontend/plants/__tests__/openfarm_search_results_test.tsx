jest.mock("../../api/crud", () => ({
  edit: jest.fn(),
  save: jest.fn(),
}));

import React from "react";
import { mount } from "enzyme";
import { OpenFarmResults, SearchResultProps } from "../openfarm_search_results";
import { fakePlant } from "../../__test_support__/fake_state/resources";
import { Path } from "../../internal_urls";
import { Actions } from "../../constants";
import { edit, save } from "../../api/crud";

describe("<OpenFarmResults />", () => {
  const fakeProps = (): SearchResultProps => ({
    cropSearchResults: [
      {
        crop: {
          slug: "potato",
          name: "S. tuberosum"
        },
        image: "potato.jpg"
      },
      {
        crop: {
          slug: "tomato",
          name: "Solanum lycopersicum"
        },
        image: "tomato.jpg"
      },
    ],
    cropSearchInProgress: false,
    plant: undefined,
    dispatch: jest.fn(),
  });

  it("renders OpenFarmSearchResults", () => {
    const p = fakeProps();
    const wrapper = mount(<OpenFarmResults {...p} />);
    const text = wrapper.text();
    expect(text).toContain(p.cropSearchResults[0].crop.name);
    expect(text).toContain(p.cropSearchResults[1].crop.name);
    expect(wrapper.find("Link").length).toEqual(p.cropSearchResults.length);
    expect(wrapper.find("Link").first().prop("to"))
      .toContain(p.cropSearchResults[0].crop.slug);
  });

  it("renders OpenFarmSearchResults for plant type change", () => {
    const p = fakeProps();
    p.plant = fakePlant();
    p.plant.body.id = 1;
    const wrapper = mount(<OpenFarmResults {...p} />);
    expect(wrapper.text()).toContain(p.cropSearchResults[0].crop.name);
    expect(wrapper.find("Link").first().prop("to"))
      .toEqual(Path.plants(1));
  });

  it("changes plant type", () => {
    const p = fakeProps();
    p.plant = fakePlant();
    p.plant.body.id = 1;
    const wrapper = mount(<OpenFarmResults {...p} />);
    wrapper.find("Link").first().simulate("click");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.SET_PLANT_TYPE_CHANGE_ID,
      payload: undefined,
    });
    expect(edit).toHaveBeenCalledWith(p.plant, {
      name: "S. tuberosum",
      openfarm_slug: "potato",
    });
    expect(save).toHaveBeenCalledWith(p.plant.uuid);
  });

  it("shows search in progress", () => {
    const p = fakeProps();
    p.cropSearchResults = [];
    p.cropSearchInProgress = true;
    const wrapper = mount(<OpenFarmResults {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("searching");
  });

  it("shows no results", () => {
    const p = fakeProps();
    p.cropSearchResults = [];
    p.cropSearchInProgress = false;
    const wrapper = mount(<OpenFarmResults {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("no search results");
  });
});
