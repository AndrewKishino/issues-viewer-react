var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router').Router;
var Route = require('react-router').Route;
var Link = require('react-router').Link;
var Redirect = require('react-router').Redirect;
var createHistory = require('history').createHashHistory;
var request = require('request');
var ReactPaginate = require('react-paginate');
var moment = require('moment');

var Home = React.createClass({
  handleRequestSubmit: function(obj) {
    var location = "/" + obj.owner + "/" + obj.repo + "/issues/";
    history.pushState(null, location);
  },
  getInitialState: function() {
    return {owner: '', repo: ''};
  },
  componentDidMount: function() {
  },
  render: function() {
    localStorage.removeItem('GithubViewerData');
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
  handlePageClick: function (data) {
    this.setState({ page: data.selected+1}, (function () {
      localStorage.removeItem('GithubViewerData');
      this.loadIssuesFromServer();
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }).bind(this));
  },
  getInitialState: function() {
    return {data: [], owner: this.props.params.owner, repo: this.props.params.repo, page: 1};
  },
  componentDidMount: function() {
    this.loadIssuesFromServer();
  },
  loadIssuesFromServer: function() {
    if(localStorage.length) {
      var localData = localStorage.getItem('GithubViewerData');
      localData = JSON.parse(localData);
      console.dir(localData);
      var matches;
      var pages = [];
      var re = /\?page=(\d+)/g;
      while ((matches = re.exec(localData.headers.link)) != null) {
        pages.push(Number(matches[1]));
      }
      this.setState({data: JSON.parse(localData.body), pageNum: pages[1]-1, nextPage: pages[0]});
      localStorage.setItem('GithubViewerData', JSON.stringify(localData));
    } else {
      request.get("https://api.github.com/repos/" + this.state.owner + "/" + this.state.repo + "/issues?page=" + this.state.page + "&per_page=25", function(err, data) {
        var matches;
        var pages = [];
        var re = /\?page=(\d+)/g;
        while ((matches = re.exec(data.headers.link)) != null) {
          pages.push(Number(matches[1]));
        }
        this.setState({data: JSON.parse(data.body), pageNum: pages[1]-1, nextPage: pages[0]});
        localStorage.setItem('GithubViewerData', JSON.stringify(data));
      }.bind(this));
    }
  },
  render: function() {
    return (
      <div className="issuesBox">
        <Link to="/"><h1>Github Issues Explorer</h1></Link>
        <h3>{this.props.params.owner + "/" + this.props.params.repo}</h3>
        <hr/>
        <IssueList data={this.state.data} />
        <div className="pagination-box">
          <ReactPaginate previousLabel={"Previous"}
                       nextLabel={"Next"}
                       breakLabel={<li className="break"><span>...</span></li>}
                       pageNum={this.state.pageNum}
                       marginPagesDisplayed={2}
                       pageRangeDisplayed={5}
                       containerClassName={"pagination"}
                       subContainerClassName={"pages pagination"}
                       clickCallback={this.handlePageClick}
                       activeClassName={"active-page"}/>
       </div>
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
          created={issue.created_at}
          comments={issue.comments}/>
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
  rawMarkup: function() {
    var rawMarkup = marked(this.props.summary.toString().replace(/\@([\d\w]+)/g, '[@$1](https://github.com/$1)').replace(/<\/*cite>/g, ''), {sanitize: true});
    return { __html: rawMarkup };
  },

  strip: function(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText;
  },

  render: function() {
    var trimmedString = this.strip(this.rawMarkup().__html).substr(0, 140);
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
    trimmedString = { __html: trimmedString };

    return (
      <div className="issue">
        <img className="avatar" src={this.props.avatar}/>
        <div className="issues-title">
          <strong><Link to={`/${this.props.owner}/${this.props.repo}/issues/${this.props.number}`}>{this.props.title}</Link></strong>
        </div>
        {this.props.labels.map(function(label, index) {
          var style = {
            backgroundColor: '#' + label.color
          }
          return (
            <span key={label.url} className="label label-default issues-label" style={style}>{label.name}</span>
          )
        })}
        <div className="issues-meta">
          #{this.props.number} opened {moment(this.props.created).fromNow()} by {this.props.username}
        </div>
        <div className="issues-comments">
          <span>{this.props.comments} comments </span><span className="octicon octicon-comment"></span>
        </div>
        <span dangerouslySetInnerHTML={trimmedString}></span>
        <hr/>
      </div>
    );
  }
});

var IssueDetails = React.createClass({
  getInitialState: function() {
    return {data: [], owner: this.props.params.owner, repo: this.props.params.repo, labels: []};
  },

  loadIssueDetails: function() {
    $.ajax({
      url: "https://api.github.com/repos/" + this.props.params.owner + "/" + this.props.params.repo + "/issues/" + this.props.params.issueid,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data, labels: data.labels, user: data.user});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  loadIssueComments: function() {
    $.ajax({
      url: "https://api.github.com/repos/" + this.props.params.owner + "/" + this.props.params.repo + "/issues/" + this.props.params.issueid + "/comments",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({comments: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  componentWillMount: function() {
    this.loadIssueDetails();
    this.loadIssueComments();
  },

  rawMarkup: function(markup) {
    var rawMarkup = marked(markup.toString().replace(/\@([\d\w]+)/g, '[@$1](https://github.com/$1)').replace(/<\/*cite>/g, ''), {sanitize: true});
    return { __html: rawMarkup };
  },

  render: function() {
    if(this.state.user && this.state.comments) {
      return (
        <div className="issue-box">
          <div className="issue-details">
            <h2>{this.state.data.title} <font className="issue-num">#{this.state.data.number}</font></h2>
            <img className="avatar" src={this.state.user.avatar_url}/><br/>
            <h4>{this.state.data.user.login}</h4>
            <span>{this.state.data.state}</span><br/>
            <h4>
              {this.state.labels.map(function(label, index) {
                return (
                  <span key={label.url}>{label.name}&nbsp;</span>
                )
              })}
            </h4>
            <span dangerouslySetInnerHTML={this.rawMarkup(this.state.data.body)}/><br/>
          </div>
          <hr/>
          <div className="issue-comments">
            <h3>Comments</h3>
            {this.state.comments.map(function(comment, index) {
              return (
                <div key={comment.id} className="comment">
                  <img className="avatar" src={comment.user.avatar_url}/><br/>
                  <h4>{comment.user.login}</h4>
                  <span dangerouslySetInnerHTML={this.rawMarkup(comment.body)}/><br/>
                  <hr/>
                </div>
              )
            }.bind(this))}
          </div>
        </div>
      );
    } else {
      return (
      <div className="issue-box">
        <div className="issue-details">
        <h2>{this.state.data.title}</h2>
        <span>{this.state.data.state}</span><br/>
        <h4>
          {this.state.labels.map(function(label, index) {
            return (
              <span key={label.url}>{label.name}&nbsp;</span>
            )
          })}
        </h4>
        <span>{this.state.data.body}</span><br/>
        </div>
      </div>
    );
    }
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
