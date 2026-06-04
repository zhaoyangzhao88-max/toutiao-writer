"""Tests for DOCX generator module — pure functions only (no file I/O)."""
import os
import re
import pytest
from services.docx_generator import (
    _sanitize_title, _build_filename,
    _is_blockquote, _is_horizontal_rule, _is_heading2,
    _is_question, _is_image_placeholder,
)


class TestSanitizeTitle:
    def test_removes_invalid_chars(self):
        assert _sanitize_title('file<>:"/\\|?*name') == 'file_________name'

    def test_truncates_long_titles(self):
        long_title = "a" * 100
        assert len(_sanitize_title(long_title)) == 80

    def test_strips_whitespace(self):
        result = _sanitize_title("  hello world  ")
        assert result == "hello world"

    def test_empty_title_defaults(self):
        assert _sanitize_title("") == "untitled"

    def test_control_chars_removed(self):
        # \x00 falls in the \x00-\x1f range and is replaced with _
        assert _sanitize_title("test\x00file") == "test_file"

    def test_normal_title_preserved(self):
        assert _sanitize_title("My Great Article") == "My Great Article"


class TestBuildFilename:
    def test_returns_yyyymmdd_format(self):
        filename = _build_filename("My Test Article")
        assert re.match(r'^\d{8}_', filename)
        assert filename.endswith('.docx')
        # Note: _sanitize_title does NOT replace spaces
        assert 'My Test Article' in filename

    def test_sanitizes_title_in_filename(self):
        filename = _build_filename('bad:name"here')
        assert 'bad_name_here' in filename
        assert filename.endswith('.docx')

    def test_handles_empty_title(self):
        filename = _build_filename("")
        assert filename.endswith('.docx')


class TestLineDetectors:
    def test_is_blockquote(self):
        assert _is_blockquote('> quoted text') is True
        assert _is_blockquote('>') is False
        assert _is_blockquote('not a quote') is False
        assert _is_blockquote('') is False

    def test_is_horizontal_rule(self):
        assert _is_horizontal_rule('---') is True
        assert _is_horizontal_rule(' --- ') is True
        assert _is_horizontal_rule('not a rule') is False
        assert _is_horizontal_rule('') is False

    def test_is_heading2(self):
        assert _is_heading2('## Section Title') is True
        assert _is_heading2('【小标题】正文内容') is True
        assert _is_heading2('Normal text') is False
        assert _is_heading2('') is False
        assert _is_heading2('### Not level 2') is False

    def test_is_question(self):
        assert _is_question('??? What do you think?') is True
        assert _is_question('???') is False
        assert _is_question('Not a question') is False
        assert _is_question('') is False

    def test_is_image_placeholder(self):
        assert _is_image_placeholder('[img]') is True
        assert _is_image_placeholder('[img] description here') is True
        assert _is_image_placeholder('not an image') is False
        assert _is_image_placeholder('') is False
