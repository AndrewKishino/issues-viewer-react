var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router').Router;
var Route = require('react-router').Route;
var Link = require('react-router').Link;
var createHistory = require('history').createHashHistory;

var history = createHistory({
  queryKey: false
});

var Issue = React.createClass({
  render: function() {
    return (
      <div className="issue">
        <img className="avatar" src={this.props.avatar}/>
        <h2 className="issueTitle">
          <Link to={`/${this.props.owner}/${this.props.repo}/issue/${this.props.id}`}>{this.props.number + " - " + this.props.title}</Link>
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

var IssuesBox = React.createClass({
  handleRequestSubmit: function(obj) {
    this.setState({page: 1});
    this.setState({owner: obj.owner});
    this.setState({repo: obj.repo});

    $.ajax({
      url: "https://api.github.com/repos/" + obj.owner + "/" + obj.repo + "/issues?page=" + this.state.page + "&per_page=100",
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
    return {data: [], owner: '', repo: '', page: 1};
  },
  componentDidMount: function() {
    // this.loadIssuesFromServer();
  },
  nextPage: function() {
    this.state.page++;
    $.ajax({
      url: "https://api.github.com/repos/" + this.state.owner + "/" + this.state.repo + "/issues?page=" + this.state.page + "&per_page=100",
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
    if(this.state.owner && this.state.repo) {
      return (
        <div className="issuesBox">
          <h1>Github Issues Explorer</h1>
          <h3>{this.state.owner + "/" + this.state.repo}</h3>
          <IssueForm onIssueSubmit={this.handleRequestSubmit} />
          <IssueList data={this.state.data} />
          <button onClick={this.nextPage} className="next-page-btn">Load More</button>
        </div>
      );
    } else {
      return (
        <div className="issuesBox">
          <h1>Github Issues Explorer</h1>
          <IssueForm onIssueSubmit={this.handleRequestSubmit} />
          <IssueList data={this.state.data} />
        </div>
      );
    }
  }
});

var IssueList = React.createClass({
  render: function() {
    var issueNodes = this.props.data.map(function(issue) {
      var re = /repos\/(\w+)\/(\w+)\/issues/;
      var match = re.exec(issue.url);
      console.log(match);
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

var IssueForm = React.createClass({
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
      <form className="issueForm" onSubmit={this.handleSubmit}>
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

var IssueDetails = React.createClass({
  render: function() {
    return (
      <div>{this.props.params.issueid}</div>
    );
  }
});



ReactDOM.render((
    <Router history={history}>
      <Route path="/" component={IssuesBox}/>
      <Route path="/:owner/:repo/issue/:issueid" component={IssueDetails}/>
    </Router>
  ), document.getElementById('content')
);
