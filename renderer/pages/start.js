// Packages
import { ipcRenderer } from "electron";
import withRedux from "next-redux-wrapper";
import React, { Component } from "react";
import PropTypes from "prop-types";

// Components
import Layout from "../components/Layout";
import TitleBar from "../components/TitleBar";

// Containers
import Search from "../containers/Search";
import Content from "../containers/Content";
import Footer from "../containers/Footer";

// Redux store
import initStore from "./../store";

// Redux action creators
import {
  setLanguage,
  resetSearch,
  showSearchPlaceholder,
  hideSearchPlaceholder,
  updateSearchQuery,
  startSearch,
  searchByQuery,
  downloadComplete,
  showSearchSpinner,
  searchByFiles,
  dropFiles,
  updateSearchResults,
} from "./../actions";

// Global variables
const ESC_KEY = 27;

class MainApp extends Component {
  constructor(props) {
    super(props);

    this.onLanguageChange = this.onLanguageChange.bind(this);
    this.checkIfOnline = this.checkIfOnline.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  // handling escape close
  componentDidMount() {
    this.checkIfOnline();

    ipcRenderer.once("download-complete", () => {
      this.props.downloadComplete();
    });

    ipcRenderer.on("results", (event, { results, isFinished }) => {
      this.props.updateSearchResults({
        results,
        searchCompleted: isFinished,
      });
    });

    ipcRenderer.on("language", (event, language) => {
      this.props.setLanguage(language);
    });

    ipcRenderer.send("getStore", "language");

    document.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("online");
  }

  onKeyDown(event) {
    if (event.keyCode >= 48 && event.keyCode <= 90) {
      this.onFocus();
    }

    if (event.keyCode === ESC_KEY) {
      this.props.resetSearch();
    }
  }

  onFocus() {
    this.props.hideSearchPlaceholder();
    this.search.getWrappedInstance().textInput.focus();
  }

  onBlur() {
    this.props.showSearchPlaceholder();
    this.search.getWrappedInstance().textInput.blur();
  }

  onLanguageChange(event) {
    const language = event.target.value;

    this.props.setLanguage(language);
  }

  onSearch(event) {
    if (event) {
      event.preventDefault();
    }

    this.props.startSearch();
  }

  checkIfOnline() {
    ipcRenderer.send("online", navigator.onLine);
    window.addEventListener("offline", () => {
      ipcRenderer.send("online", navigator.onLine);
    });
  }

  render() {
    return (
      <Layout>
        <TitleBar title="Caption" />
        <Search
          onSubmit={this.onSearch}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          ref={search => {
            this.search = search;
          }}
        />
        <Content />
        <Footer />
      </Layout>
    );
  }
}

MainApp.propTypes = {
  downloadComplete: PropTypes.func.isRequired,
  updateSearchResults: PropTypes.func.isRequired,
  setLanguage: PropTypes.func.isRequired,
  resetSearch: PropTypes.func.isRequired,
  hideSearchPlaceholder: PropTypes.func.isRequired,
  showSearchPlaceholder: PropTypes.func.isRequired,
  startSearch: PropTypes.func.isRequired,
};

const mapStateToProps = ({ ui, search }) => ({
  language: ui.language,
  searchQuery: search.searchQuery,
  files: search.files,
  placeholder: search.placeholder,
  results: search.results,
  loading: search.loading,
  searchCompleted: search.searchCompleted,
});

const mapDispatchToProps = {
  setLanguage,
  resetSearch,
  showSearchPlaceholder,
  hideSearchPlaceholder,
  startSearch,
  searchByQuery,
  updateSearchQuery,
  downloadComplete,
  showSearchSpinner,
  searchByFiles,
  dropFiles,
  updateSearchResults,
};

export default withRedux(initStore, mapStateToProps, mapDispatchToProps)(MainApp);
