var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router').Router;
var Route = require('react-router').Route;
var Link = require('react-router').Link;
var Redirect = require('react-router').Redirect;
var createHistory = require('history').createHashHistory;

var Home = React.createClass({
  handleRequestSubmit: function(obj) {
    var location = "/#/" + obj.owner + "/" + obj.repo + "/issues/"
    document.location.href = location;
    // this.setState({page: 1});
    // this.setState({owner: obj.owner});
    // this.setState({repo: obj.repo});
  },
  getInitialState: function() {
    return {owner: '', repo: ''};
  },
  componentDidMount: function() {
    // this.loadIssuesFromServer();
  },
  render: function() {
    return (
      <div className="home">
        <h1>Github Issues Explorer</h1>
        <SearchForm onIssueSubmit={this.handleRequestSubmit} />
      </div>
    );
  }
});

var SearchForm = React.createClass({
  getInitialState: function() {
    return {owner: '', repo: ''};
  },
  handleOwnerChange: function(e) {
    this.setState({owner: e.target.value});
  },
  handleRepoChange: function(e) {
    this.setState({repo: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var owner = this.state.owner.trim();
    var repo = this.state.repo.trim();
    if (!repo || !owner) {
      return;
    }
    this.props.onIssueSubmit({owner: owner, repo: repo});
  },
  render: function() {
    return (
      <form className="searchForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          id="owner"
          placeholder="Owner"
          value={this.props.owner}
          onChange={this.handleOwnerChange}
        />
        <input
          type="text"
          id="repo"
          placeholder="Repository"
          value={this.props.repo}
          onChange={this.handleRepoChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

var IssuesBox = React.createClass({
  handleRequestSubmit: function(obj) {
    this.setState({page: 1});
    this.setState({owner: obj.owner});
    this.setState({repo: obj.repo});

    $.ajax({
      url: "https://api.github.com/repos/" + obj.owner + "/" + obj.repo + "/issues?page=" + this.state.page + "&per_page=25",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: [], owner: this.props.params.owner, repo: this.props.params.repo, page: 0};
  },
  componentDidMount: function() {
    this.loadIssuesFromServer();
  },
  loadIssuesFromServer: function() {
    this.state.page++;
    $.ajax({
      url: "https://api.github.com/repos/" + this.state.owner + "/" + this.state.repo + "/issues?page=" + this.state.page + "&per_page=25",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: this.state.data.concat(data)});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  render: function() {
    return (
      <div className="issuesBox">
        <Link to="/"><h1>Github Issues Explorer</h1></Link>
        <h3>{this.props.params.owner + "/" + this.props.params.repo}</h3>
        <IssueList data={this.state.data} />
        <button onClick={this.loadIssuesFromServer} className="next-page-btn">Load More</button>
      </div>
    );
  }
});

var IssueList = React.createClass({
  render: function() {
    var issueNodes = this.props.data.map(function(issue) {
      var re = /repos\/(.+)\/(.+)\/issues/;
      var match = re.exec(issue.url);
      return (
        <Issue
          key={issue.id}
          id={issue.id}
          owner={match[1]}
          repo={match[2]}
          number={issue.number}
          title={issue.title} 
          labels={issue.labels} 
          username={issue.user.login} 
          avatar={issue.user.avatar_url}
          summary={issue.body}
        />
      );
    });
    return (
      <div className="issueList">
        {issueNodes}
      </div>
    );
  }
});

var Issue = React.createClass({
  render: function() {
    return (
      <div className="issue">
        <img className="avatar" src={this.props.avatar}/>
        <h2 className="issueTitle">
          <Link to={`/${this.props.owner}/${this.props.repo}/issues/${this.props.id}`}>{this.props.number + " - " + this.props.title}</Link>
        </h2>
        <h4>
          {this.props.labels.map(function(label, index) {
            return (
              <span key={label.url}>{label.name}&nbsp;</span>
            )
          })}
        </h4>
        <span>{this.props.summary.substring(0,140) + "..."}</span>
        <hr/>
      </div>
    );
  }
});

var IssueDetails = React.createClass({
  render: function() {
    return (
      <div>{this.props.params.issueid}</div>
    );
  }
});

var history = createHistory({
  queryKey: false
});

ReactDOM.render((
    <Router history={history}>
      <Route path="/" component={Home}/>
      <Route path="/:owner/:repo/issues" component={IssuesBox}/>
      <Route path="/:owner/:repo/issues/:issueid" component={IssueDetails}/>
    </Router>
  ), document.getElementById('content')
);
